// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ChamaDAO} from "./ChamaDAO.sol";

contract ChamaFactory {
    event ChamaCreated(
        address indexed chamaAddress,
        string name,
        address indexed creator,
        string ipfsConstitutionCID
    );
    
    mapping(address => address[]) public userChamas;
    address[] public allChamas;
    uint256 public chamaCount;
    
    function createChama(
        string memory _name,
        address[] memory _initialMembers,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        string memory _ipfsConstitutionCID
    ) external returns (address) {
        require(_initialMembers.length > 0, "Need initial members");
        
        ChamaDAO newChama = new ChamaDAO(
            _name,
            _initialMembers,
            _votingPeriod,
            _quorumPercentage,
            _ipfsConstitutionCID,
            msg.sender
        );
        
        address chamaAddress = address(newChama);
        allChamas.push(chamaAddress);
        chamaCount++;
        
        for (uint256 i = 0; i < _initialMembers.length; i++) {
            userChamas[_initialMembers[i]].push(chamaAddress);
        }
        
        emit ChamaCreated(chamaAddress, _name, msg.sender, _ipfsConstitutionCID);
        return chamaAddress;
    }
    
    function getUserChamas(address _user) external view returns (address[] memory) {
        return userChamas[_user];
    }
    
    function getAllChamas() external view returns (address[] memory) {
        return allChamas;
    }
}

