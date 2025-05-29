// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./ParticipantsLib.sol";

contract Vault {
    uint private _id = 0;

    enum CapsuleStatus {
        Null,
        Registered,
        Encrypted,
        Decrypted,
        Approved
    }

    struct Capsule {
        uint id;
        CapsuleStatus status;
        /**
         * @dev 캡슐 소유자 주소
         */
        address owner;
        /**
         * @dev 캡슐 참여 수수료 (wei)
         */
        uint fee;
        /**
         * @dev 캡슐 제목
         */
        string title;
        /**
         * @dev 캡슐 생성일
         */
        uint createdAt;
        /**
         * @dev 캡슐 개봉일
         */
        uint releasedAt;
        uint participantCount;
        /**
         * @dev 암호화에 사용되는 초기화 벡터
         */
        bytes iv;
        /**
         * @dev 캡슐 소유자의 ecdh 공개키
         */
        bytes publicKey;
        /**
         * @dev 캡슐 데이터 복호화에 사용되는 마스터 키
         */
        bytes decryptedKey;
    }

    using ParticipantsLib for ParticipantsLib.Participants;

    mapping(uint => Capsule) capsules;
    mapping(address => uint[]) userCapsules;
    uint[] availableCapsuleIds;
    mapping(uint => ParticipantsLib.Participants) capsuleParticipants;
    mapping(address => uint[]) participatedCapsuleIds;

    function getMyCapsules() public view returns (Capsule[] memory) {
        Capsule[] memory myCapsules = new Capsule[](
            userCapsules[msg.sender].length
        );

        for (uint i = 0; i < userCapsules[msg.sender].length; i++) {
            myCapsules[i] = capsules[userCapsules[msg.sender][i]];
        }

        return myCapsules;
    }

    function getAvailableCapsules()
        public
        view
        returns (Capsule[] memory, bool[] memory)
    {
        Capsule[] memory availableCapsules = new Capsule[](
            availableCapsuleIds.length
        );
        bool[] memory participated = new bool[](availableCapsuleIds.length);

        for (uint i = 0; i < availableCapsuleIds.length; i++) {
            availableCapsules[i] = capsules[availableCapsuleIds[i]];
            participated[i] = capsuleParticipants[i].map[msg.sender] > 0;
        }

        return (availableCapsules, participated);
    }

    function getParticipatedCapsules() public view returns (Capsule[] memory) {
        Capsule[] memory participatedCapsules = new Capsule[](
            participatedCapsuleIds[msg.sender].length
        );

        for (uint i = 0; i < participatedCapsuleIds[msg.sender].length; i++) {
            participatedCapsules[i] = capsules[
                participatedCapsuleIds[msg.sender][i]
            ];
        }

        return participatedCapsules;
    }

    function getCapsule(uint id) public view returns (Capsule memory) {
        return capsules[id];
    }

    function getParticipants(
        uint id
    ) public view returns (ParticipantsLib.Participant[] memory) {
        return capsuleParticipants[id].list;
    }

    function isParticipated(uint id) public view returns (uint) {
        return capsuleParticipants[id].map[msg.sender];
    }

    event Registered(
        uint id,
        address owner,
        uint fee,
        string title,
        uint createdAt,
        uint releasedAt
    );

    function register(
        string memory title,
        uint releasedAt,
        bytes memory iv
    ) external payable returns (uint) {
        // require(msg.value > 0, "Fee must be greater than 0");
        require(
            releasedAt > block.timestamp,
            "Release date must be in the future"
        );
        uint id = _id++;

        Capsule storage capsule = capsules[id];
        capsule.id = id;
        capsule.status = CapsuleStatus.Registered;
        capsule.owner = msg.sender;
        capsule.fee = msg.value;
        capsule.title = title;
        capsule.createdAt = block.timestamp;
        capsule.releasedAt = releasedAt;
        capsule.iv = iv;
        userCapsules[capsule.owner].push(id);
        availableCapsuleIds.push(id);

        emit Registered(
            id,
            capsule.owner,
            capsule.fee,
            capsule.title,
            capsule.createdAt,
            capsule.releasedAt
        );

        return id;
    }

    event Participated(uint id, address participant, bytes publicKey);

    function participate(uint id, bytes memory publicKey) external {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Registered,
            "Can participate only in registered state capsule"
        );
        capsuleParticipants[id].add(msg.sender, publicKey);
        participatedCapsuleIds[msg.sender].push(id);
        capsule.participantCount++;
        emit Participated(id, msg.sender, publicKey);
    }

    event Encrypted(uint id, bytes publicKey, bytes[] encryptedKeys);
    /**
     * 타임캡슐을 암호화하고 각 참여자에게 복호화 키를 발급합니다.
     * @param id 타임캡슐 ID
     */
    function encrypt(
        uint id,
        bytes memory publicKey,
        bytes[] memory encryptedKeys
    ) external {
        Capsule storage capsule = capsules[id];
        ParticipantsLib.Participants storage participants = capsuleParticipants[
            id
        ];
        require(
            capsule.status == CapsuleStatus.Registered,
            "Capsule is not registered"
        );
        require(
            msg.sender == capsule.owner,
            "Only the owner can encrypt the capsule"
        );
        require(participants.list.length > 0, "No participants to encrypt");

        removeCapsuleFromAvailable(id);
        capsule.publicKey = publicKey;
        capsule.status = CapsuleStatus.Encrypted;

        for (uint i = 0; i < participants.list.length; i++) {
            ParticipantsLib.Participant storage participant = participants.get(
                i
            );
            participant.encryptedKey = encryptedKeys[i];
        }

        emit Encrypted(id, publicKey, encryptedKeys);
    }

    event Decrypted(uint id, bytes privateKey);

    function decrypt(uint id, bytes memory privateKey) external {
        Capsule storage capsule = capsules[id];
        ParticipantsLib.Participants storage participants = capsuleParticipants[
            id
        ];
        require(
            capsule.status == CapsuleStatus.Encrypted,
            "Capsule is not encrypted yet"
        );
        require(
            participants.has(msg.sender),
            "Only participants can decrypt the capsule"
        );

        ParticipantsLib.Participant storage participant = participants.get(
            msg.sender
        );

        participant.decryptAt = block.timestamp;
        // TODO: 참여자의 복호화 키가 잘못되었을때를 대비해야 함
        participant.privateKey = privateKey;

        (bytes memory decryptedKey, bool valid) = decryptKey(
            participant.privateKey,
            participant.encryptedKey
        );
        if (!valid) revert("Invalid private key");

        capsule.decryptedKey = decryptedKey;
        participant.isApproved = true;
        emit Decrypted(id, capsule.decryptedKey);
    }

    function decryptKey(
        bytes memory privateKey,
        bytes memory encryptedKey
    ) internal pure returns (bytes memory, bool) {
        return ("", true);
    }

    function approve(uint id) public payable {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Encrypted,
            "Capsule is not encrypted"
        );
        require(
            msg.sender == capsule.owner,
            "Only the owner can approve the capsule"
        );

        capsule.status = CapsuleStatus.Approved;
        distributeRewards(id);
    }

    function deleteCapsule(uint id) public payable {
        Capsule storage capsule = capsules[id];
        require(
            msg.sender == capsule.owner,
            "Only the owner can approve the capsule"
        );

        distributeRewards(id);

        // delete capsule
        delete capsules[id];

        // delete participants
        capsuleParticipants[id].remove();

        // delete from userCapsules
        uint[] storage userCapsuleList = userCapsules[capsule.owner];
        for (uint i = 0; i < userCapsuleList.length; i++) {
            if (userCapsuleList[i] != id) continue;

            userCapsuleList[i] = userCapsuleList[userCapsuleList.length - 1];
            userCapsuleList.pop();
            break;
        }

        // delete availableCapsules
        removeCapsuleFromAvailable(id);
    }

    function removeCapsuleFromAvailable(uint id) internal {
        for (uint i = 0; i < availableCapsuleIds.length; i++) {
            if (availableCapsuleIds[i] != id) continue;

            availableCapsuleIds[i] = availableCapsuleIds[
                availableCapsuleIds.length - 1
            ];
            availableCapsuleIds.pop();
            break;
        }
    }

    // 보상 배분 함수
    function distributeRewards(uint id) internal {
        // Capsule storage capsule = capsules[id];
        // // TODO: 제출자들에게 보상 배분
        // uint currentBalance = capsule.fee;
        // if (currentBalance == 0) {
        //     // checks
        //     revert();
        // }
        // capsule.fee = 0; // effects
        // address[] memory participants;
    }
}
