// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public superAdmin;
    mapping(address => bool) public isAdmin;

    struct Certificate {
        string certificateHash;
        address issuer;
        uint256 timestamp;
    }

    mapping(string => Certificate) public certificates;

    event CertificateIssued(string certificateId, string certificateHash, address issuer, uint256 timestamp);
    event AdminAdded(address newAdmin);

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin can perform this");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == superAdmin, "Only admin can perform this action");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address _newAdmin) public onlySuperAdmin {
        require(!isAdmin[_newAdmin], "Address is already an admin");
        isAdmin[_newAdmin] = true;
        emit AdminAdded(_newAdmin);
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
