// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./ParticipantsLib.sol";
import "./EllipticCurve.sol";

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
        bytes12 iv;
        /**
         * @dev 캡슐 소유자의 ECDH 공개키 x 좌표
         */
        bytes32 publicKey;
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
        bytes12 iv
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

    event Participated(uint id, address participant, bytes32 publicKey);

    function participate(uint id, bytes32 publicKey) external {
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

    event Encrypted(uint id, bytes32 publicKey, bytes[] encryptedKeys);
    /**
     * 타임캡슐을 암호화하고 각 참여자에게 복호화 키를 발급합니다.
     * @param id 타임캡슐 ID
     */
    function encrypt(
        uint id,
        bytes32 publicKey,
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

    event Decrypted(uint id, bytes32 privateKey);

    function decrypt(uint id, bytes32 privateKey) external {
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
        require(
            participant.publicKey == derivePublicKey(privateKey),
            "Invalid private key"
        );

        participant.decryptAt = block.timestamp;
        participant.privateKey = privateKey;
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
        Capsule storage capsule = capsules[id];
        // TODO: 제출자들에게 보상 배분
        uint bal = capsule.fee;
        require(bal > 0);
        capsule.fee = 0; // effects

        ParticipantsLib.Participants storage participants = capsuleParticipants[
            id
        ];

        uint len = 0;
        ParticipantsLib.Participant[]
            memory submittedParticipants = new ParticipantsLib.Participant[](
                participants.list.length
            );

        for (uint i = 0; i < participants.list.length; i++) {
            ParticipantsLib.Participant storage participant = participants.get(
                i
            );
            if (participant.decryptAt == 0) continue; // 복호화하지 않은 참여자는 제외
            submittedParticipants[len++] = participant;
        }

        // 균등 분배
        for (uint i = 0; i < len; i++) {
            ParticipantsLib.Participant
                memory participant = submittedParticipants[i];
            uint reward = bal / (len - i);
            payable(participant.addr).transfer(reward);
            bal -= reward;
        }
    }

    // // secp256k1 타원 곡선 파라미터
    // uint256 private constant GX =
    //     0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    // uint256 private constant GY =
    //     0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    // uint256 private constant AA = 0;
    // uint256 private constant BB = 7;
    // uint256 private constant PP =
    //     0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    // p256 타원 곡선 파라미터
    uint256 private constant GX =
        0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296;
    uint256 private constant GY =
        0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5;
    uint256 private constant AA =
        0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC;
    uint256 private constant BB =
        0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B;
    uint256 private constant PP =
        0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF;

    function derivePublicKey(bytes32 privKey) internal pure returns (bytes32) {
        (uint256 x, ) = EllipticCurve.ecMul(uint256(privKey), GX, GY, AA, PP);

        return bytes32(x);
    }
}
