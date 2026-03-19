const { expect } = require("chai");
const hre = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let registry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    registry = await CertificateRegistry.deploy();
  });

  it("Should set the right admin", async function () {
    expect(await registry.admin()).to.equal(owner.address);
  });

  it("Should allow admin to issue a certificate", async function () {
    const certId = "CERT-123";
    const certHash = "0xaaabbbccc111222333";
    
    await expect(registry.issueCertificate(certId, certHash))
      .to.emit(registry, "CertificateIssued");

    const cert = await registry.verifyCertificate(certId);
    expect(cert[0]).to.equal(certHash);
    expect(cert[1]).to.equal(owner.address);
  });

  it("Should not allow non-admin to issue a certificate", async function () {
    const certId = "CERT-456";
    const certHash = "0xddd";
    
    await expect(
      registry.connect(addr1).issueCertificate(certId, certHash)
    ).to.be.revertedWith("Only admin can perform this action");
  });

  it("Should not allow issuing a certificate with an existing ID", async function () {
    const certId = "CERT-789";
    const certHash = "0xeee";
    
    await registry.issueCertificate(certId, certHash);

    await expect(
      registry.issueCertificate(certId, "0xffff")
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("Should revert when verifying a non-existent certificate", async function () {
    await expect(
      registry.verifyCertificate("INVALID-ID")
    ).to.be.revertedWith("Certificate not found");
  });
});
