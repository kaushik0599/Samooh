// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SamoohGovernance.sol";
import "./SamoohTreasury.sol";

/// @notice Deploys one SamoohGovernance + one SamoohTreasury pair per
/// Samooh and wires them to each other. See docs/GOVERNANCE_SPEC.md.
contract SamoohFactory {
    event SamoohCreated(address indexed governance, address indexed treasury, address indexed admin);

    function createSamooh(
        address admin,
        address[] calldata initialMembers
    ) external returns (address governance, address treasury) {
        SamoohTreasury treasuryContract = new SamoohTreasury();
        SamoohGovernance governanceContract = new SamoohGovernance(
            admin,
            payable(address(treasuryContract)),
            initialMembers
        );
        treasuryContract.setGovernance(address(governanceContract));

        emit SamoohCreated(address(governanceContract), address(treasuryContract), admin);
        return (address(governanceContract), address(treasuryContract));
    }
}
