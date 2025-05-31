// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

library ParticipantsLib {
    struct Participant {
        address addr;
        /**
         * @dev 각 참여자의 ECDH 공개키 x 좌표
         */
        bytes32 publicKey;
        /**
         * @dev 암호화된 마스터 키 bytes48
         */
        bytes encryptedKey;
        /**
         * @dev 각 참여자의 ECDH 비밀키
         */
        bytes32 privateKey;
        uint decryptAt;
    }

    struct Participants {
        Participant[] list;
        mapping(address => uint) map;
    }

    function add(
        Participants storage participants,
        address addr,
        bytes32 publicKey
    ) external {
        require(participants.map[addr] == 0, "Participant already exists");
        participants.list.push(Participant(addr, publicKey, "", 0, 0));
        participants.map[addr] = participants.list.length;
    }

    function has(
        Participants storage participants,
        address addr
    ) public view returns (bool) {
        return participants.map[addr] > 0;
    }
    function has(
        Participants storage participants,
        uint index
    ) public view returns (bool) {
        return index < participants.list.length;
    }

    function get(
        Participants storage participants,
        uint index
    ) public view returns (Participant storage) {
        require(has(participants, index), "Participant not found at index");
        return participants.list[index];
    }

    function get(
        Participants storage participants,
        address addr
    ) public view returns (Participant storage) {
        require(has(participants, addr), "Participant not found at address");
        return participants.list[participants.map[addr] - 1];
    }

    function remove(Participants storage participants) public {
        for (uint i = 0; i < participants.list.length; i++) {
            delete participants.map[participants.list[i].addr];
        }
        delete participants.list;
    }
}
