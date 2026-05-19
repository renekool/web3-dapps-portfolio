// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Test} from "forge-std/Test.sol";
import {TokenB} from "../src/tokens/TokenB.sol";

contract TokenBTest is Test {
    TokenB public token;

    function setUp() public {
        token = new TokenB();
    }

    function test_initialBalance() public view {
        assertEq(token.balanceOf(address(this)), 1000000 * 10**uint256(token.decimals()));
    }

    function test_mint() public {
        token.mint(address(1), 100);
        assertEq(token.balanceOf(address(1)), 100);
    }
}
