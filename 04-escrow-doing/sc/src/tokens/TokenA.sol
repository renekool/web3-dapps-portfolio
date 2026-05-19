// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20 {
    constructor() ERC20("Token A", "TKA") {
        _mint(msg.sender, 1000000 * 10**uint256(decimals()));
    }

    /// @dev Anvil-only: permissionless mint for testing. Never deploy to production.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
