// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

contract Vault {
    uint256 private _id = 0;

    enum CapsuleStatus {
        Null,
        Registered,
        Encrypted,
        RequestDecrypt,
        Decrypted
    }

    struct Participant {
        address addr;
        /**
         * @dev 각 참여자의 공개키
         */
        string publicKey;
        /**
         * @dev 암호화된 복호화 키
         */
        string encryptedKey;
        uint decryptedAt;
    }

    struct Capsule {
        CapsuleStatus status;
        address owner;
        /**
         * @dev 캡슐 참여 수수료
         */
        uint256 fee;
        /**
         * @dev 캡슐 생성일
         */
        uint createdAt;
        /**
         * @dev 캡슐 개봉일
         */
        uint releasedAt;
        /**
         * @dev 캡슐 데이터 암호화에 사용되는 키
         */
        string encryptionKey;
        /**
         * @dev 캡슐 데이터 복호화에 사용되는 키
         */
        string decryptionKey;
        // encryptionKey for each participant
        Participant[] participants;
        mapping(address => bool) participantMap;
    }

    mapping(uint256 => Capsule) capsules;

    // function get(uint256 id) public view returns (Capsule memory) {
    //     return capsules[id];
    // }

    // not encrypted yet
    function register(uint releasedAt) public payable returns (uint256) {
        // require(msg.value > 0, "Fee must be greater than 0");
        uint256 id = _id++;

        Capsule storage capsule = capsules[id];
        capsule.status = CapsuleStatus.Registered;
        capsule.owner = msg.sender;
        capsule.fee = msg.value;
        capsule.createdAt = block.timestamp;
        capsule.releasedAt = releasedAt;

        return id;
    }

    event Participated(uint256 id, address participantAddr, string publicKey);

    function participate(uint256 id, string memory publicKey) public {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Registered,
            "Capsule is not registered"
        );
        require(
            capsule.participantMap[msg.sender] == false,
            "Already participated"
        );

        capsule.participants.push(Participant(msg.sender, publicKey, "", 0));
        capsule.participantMap[msg.sender] = true;
        emit Participated(id, msg.sender, publicKey);
    }

    event Encrypted(uint256 id, string encryptionKey);

    /**
     * 타임캡슐을 암호화하고 각 참여자에게 복호화 키를 발급합니다.
     * @param id 타임캡슐 ID
     */
    function addEncryptionKey(
        uint256 id,
        string memory encryptionKey,
        string[] memory encryptedKeys
    ) public {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Registered,
            "Capsule is not registered"
        );
        require(
            msg.sender == capsule.owner,
            "Only the owner can encrypt the capsule"
        );
        require(capsule.participants.length > 0, "No participants to encrypt");
        require(
            capsule.participants.length == encryptedKeys.length,
            "Invalid encrypted keys length"
        );

        capsule.status = CapsuleStatus.Encrypted;
        capsule.encryptionKey = encryptionKey;

        for (uint256 i = 0; i < capsule.participants.length; i++) {
            Participant storage participant = capsule.participants[i];
            participant.encryptedKey = encryptedKeys[i];
        }

        emit Encrypted(id, encryptionKey);
    }

    event RequestDecrypt(uint256 id, address participant, string encryptedKey);

    function requestDecrypt(uint256 id) public {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Encrypted,
            "Capsule is not encrypted"
        );
        require(
            msg.sender == capsule.owner,
            "Only the owner can request decryption"
        );
        require(
            capsule.releasedAt >= block.timestamp,
            "Can only request decryption after release date"
        );

        for (uint256 i = 0; i < capsule.participants.length; i++) {
            Participant storage participant = capsule.participants[i];
            emit RequestDecrypt(id, participant.addr, participant.encryptedKey);
        }
    }

    event Decrypted(uint256 id, string decryptionKey);

    function decrypt(uint256 id, string memory decryptionKey) public {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.RequestDecrypt,
            "Capsule is not encrypted yet"
        );
        require(
            capsule.participantMap[msg.sender] == true,
            "Only participants can decrypt the capsule"
        );

        for (uint256 i = 0; i < capsule.participants.length; i++) {
            Participant storage participant = capsule.participants[i];
            if (msg.sender != participant.addr) continue;

            participant.decryptedAt = block.timestamp;
            // TODO: 참여자의 복호화 키가 잘못되었을때를 대비해야 함
            capsule.decryptionKey = decryptionKey;

            emit Decrypted(id, capsule.decryptionKey);
        }
    }

    function approve(uint256 id) public view {
        Capsule storage capsule = capsules[id];
        require(
            capsule.status == CapsuleStatus.Encrypted,
            "Capsule is not encrypted"
        );
        require(
            msg.sender == capsule.owner,
            "Only the owner can approve the capsule"
        );
        // TODO: 제출자들에게 보상 배분
    }
}
