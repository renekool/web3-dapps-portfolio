// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC2771Forwarder} from "openzeppelin-contracts/contracts/metatx/ERC2771Forwarder.sol";

contract MockForwarder is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {}

    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    struct ForwardRequestDataTest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint48 deadline;
        bytes data;
        bytes signature;
    }
}
