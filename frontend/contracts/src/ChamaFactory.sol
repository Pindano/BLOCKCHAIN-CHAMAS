// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ChamaMembershipToken.sol";
import "./ChamaGovernor.sol";

contract ChamaFactory {
    address public immutable tokenImplementation;
    address public immutable governorImplementation;

    struct ChamaInfo {
        address membershipToken;
        address governor;
        address[] founders;
        uint256 createdAt;
        string name;
        address bankObserver;
    }

    ChamaInfo[] public chamas;
    mapping(address => uint256) public chamaIndex;
    mapping(address => address[]) public userChamas;

    event ChamaCreated(
        address indexed governor,
        address indexed membershipToken,
        address[] founders,
        string name,
        address bankObserver,
        uint256 chamaId
    );

    constructor() {
        tokenImplementation   = address(new ChamaMembershipToken());
        governorImplementation = address(new ChamaGovernor());
    }

    function createChama(
        string memory chamaName,
        string memory tokenSymbol,
        address[] memory founders,
        address bankObserver
    ) external returns (address governorAddress, address tokenAddress) {
        require(founders.length > 0 && founders.length <= 100, "Invalid founders");
        require(bankObserver != address(0), "Invalid bank");

        for (uint i = 0; i < founders.length; i++) {
            require(founders[i] != address(0), "Zero address");
            for (uint j = i + 1; j < founders.length; j++) {
                require(founders[i] != founders[j], "Duplicate");
            }
        }

        address tokenClone = Clones.clone(tokenImplementation);
        ChamaMembershipToken(payable(tokenClone)).initialize(
            string.concat(chamaName, " Membership"),
            tokenSymbol
        );

        address governorClone = Clones.clone(governorImplementation);
        ChamaGovernor(payable(governorClone)).initialize(
            IVotes(tokenClone),
            chamaName,
            bankObserver
        );

        ChamaMembershipToken(tokenClone).initializeGovernor(governorClone, founders);

        uint256 chamaId = chamas.length;
        for (uint i = 0; i < founders.length; i++) {
            userChamas[founders[i]].push(governorClone);
        }

        ChamaInfo memory info = ChamaInfo({
            membershipToken: tokenClone,
            governor: governorClone,
            founders: founders,
            createdAt: block.timestamp,
            name: chamaName,
            bankObserver: bankObserver
        });

        chamaIndex[governorClone] = chamaId;
        chamas.push(info);

        emit ChamaCreated(governorClone, tokenClone, founders, chamaName, bankObserver, chamaId);

        return (governorClone, tokenClone);
    }

    function getAllChamas() external view returns (ChamaInfo[] memory) { return chamas; }
    function getChamaById(uint256 id) external view returns (ChamaInfo memory) {
        require(id < chamas.length, "Invalid ID"); return chamas[id];
    }
    function getChamaByGovernor(address gov) external view returns (ChamaInfo memory) {
        uint256 idx = chamaIndex[gov];
        require(chamas[idx].governor == gov, "Not found"); return chamas[idx];
    }
    function getUserChamas(address user) external view returns (address[] memory) { return userChamas[user]; }
    function getUserChamaCount(address user) external view returns (uint256) { return userChamas[user].length; }
    function getChamaCount() external view returns (uint256) { return chamas.length; }
    function isFounder(address user, address gov) external view returns (bool) {
        uint256 idx = chamaIndex[gov];
        if (chamas[idx].governor != gov) return false;
        for (uint i = 0; i < chamas[idx].founders.length; i++) {
            if (chamas[idx].founders[i] == user) return true;
        }
        return false;
    }
}
