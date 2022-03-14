import { expect } from "chai";
import { ethers } from "hardhat";
import { Consideration as ConsiderationContract } from "../typechain";
import { TestERC721 } from "../typechain/TestERC721";
import { randomBytes } from "crypto";
import { Consideration } from "../src/consideration";

describe("Consideration", function () {
  let considerationContract: ConsiderationContract;
  let consideration: Consideration;
  let testERC721: TestERC721;

  before(async () => {
    const ConsiderationFactory = await ethers.getContractFactory(
      "Consideration"
    );
    considerationContract = await ConsiderationFactory.deploy(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );
    await considerationContract.deployed();

    consideration = new Consideration(ethers.provider, {
      overrides: { contractAddress: considerationContract.address },
    });

    const TestERC721 = await ethers.getContractFactory("TestERC721");
    testERC721 = await TestERC721.deploy();
    await testERC721.deployed();
  });

  it("should return a valid order", async function () {
    const [offerer, zone] = await ethers.getSigners();
    const startTime = 0;
    const endTime = ethers.BigNumber.from(
      "0xff00000000000000000000000000000000000000000000000000000000000000"
    );
    const salt = randomBytes(32);

    const nftId = 0;

    const offer = [
      {
        itemType: 2, // ERC721
        token: testERC721.address,
        identifierOrCriteria: nftId,
        startAmount: 1,
        endAmount: 1,
      },
    ];

    const considerationData = [
      {
        itemType: 0, // ETH
        token: ethers.constants.AddressZero,
        identifierOrCriteria: 0, // ignored for ETH
        startAmount: ethers.utils.parseEther("10"),
        endAmount: ethers.utils.parseEther("10"),
        recipient: offerer.address,
      },
      {
        itemType: 0, // ETH
        token: ethers.constants.AddressZero,
        identifierOrCriteria: 0, // ignored for ETH
        startAmount: ethers.utils.parseEther("1"),
        endAmount: ethers.utils.parseEther("1"),
        recipient: zone.address,
      },
    ];

    const orderParameters = {
      offerer: offerer.address,
      zone: ethers.constants.AddressZero,
      offer,
      consideration: considerationData,
      orderType: 0,
      salt,
      startTime,
      endTime,
    };

    const signature = await consideration.signOrder(orderParameters);

    expect(
      await considerationContract.validate([
        { parameters: orderParameters, signature },
      ])
    );
  });
});
