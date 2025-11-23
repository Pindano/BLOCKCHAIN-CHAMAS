// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

contract RemoveMemberCalldata is Script {
    // Replace with your actual contract address (optional)
    address constant TARGET_CONTRACT = 0x801Ef46d61a166D898170C2951562351E64740d2;

    function run() external pure returns (bytes memory) {
        address memberToRemove = 0x7584A22EE30d99AcF33e17E42EC6DeAb612944D4;

        // Step 1: Get function selector for _removeMember(address)
        bytes4 selector = bytes4(keccak256("_removeMember(address)"));

        // Step 2: Encode the argument
        bytes memory calldata_ = abi.encodeWithSelector(selector, memberToRemove);

        // Step 3: Print it
        console.log("Function selector:  ", vm.toString(selector));
        console.log("Full calldata:      ", vm.toString(calldata_));

        // Optional: Also print as hex string
        console.log("Calldata (hex):     0x", vm.toString(calldata_));
        return calldata_;
    }
}
