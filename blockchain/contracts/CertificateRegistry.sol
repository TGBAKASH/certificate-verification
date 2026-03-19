// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public admin;

    struct Certificate {
        string certificateHash;
        address issuer;
        uint256 timestamp;
    }

    mapping(string => Certificate) public certificates;

    event CertificateIssued(string certificateId, string certificateHash, address issuer, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function issueCertificate(string memory _certificateId, string memory _certificateHash) public onlyAdmin {
        require(certificates[_certificateId].timestamp == 0, "Certificate ID already exists");
        
        certificates[_certificateId] = Certificate({
            certificateHash: _certificateHash,
            issuer: msg.sender,
            timestamp: block.timestamp
        });

        emit CertificateIssued(_certificateId, _certificateHash, msg.sender, block.timestamp);
    }

    function verifyCertificate(string memory _certificateId) public view returns (string memory, address, uint256) {
        require(certificates[_certificateId].timestamp != 0, "Certificate not found");
        Certificate memory cert = certificates[_certificateId];
        return (cert.certificateHash, cert.issuer, cert.timestamp);
    }
}
