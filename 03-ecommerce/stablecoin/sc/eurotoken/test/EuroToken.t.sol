// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;

    address public owner;
    address public alice;
    address public bob;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        vm.prank(owner);
        token = new EuroToken();
    }

    // ─── 3.2 Metadatos ────────────────────────────────────────────────────────

    function test_metadata() public view {
        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);
        assertEq(token.MAX_SUPPLY(), 100_000_000 * 10 ** 6);
    }

    // ─── 3.3 Supply inicial cero ──────────────────────────────────────────────

    function test_initialSupplyIsZero() public view {
        assertEq(token.totalSupply(), 0);
    }

    // ─── 3.4 Mint exitoso por owner ───────────────────────────────────────────

    function test_mintByOwnerIncreasesBalance() public {
        uint256 amount = 10_000_000; // 10 EURT
        vm.prank(owner);
        token.mint(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), amount);
    }

    // ─── 3.5 Mint emite evento Minted ─────────────────────────────────────────

    function test_mintEmitsMintedEvent() public {
        uint256 amount = 5_000_000; // 5 EURT
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit EuroToken.Minted(alice, amount);
        token.mint(alice, amount);
    }

    // ─── 3.6 Mint rechazado por no-owner ─────────────────────────────────────

    function test_mintRevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                alice
            )
        );
        token.mint(alice, 1_000_000);
    }

    // ─── 3.7 Mint rechazado al superar MAX_SUPPLY ─────────────────────────────

    function test_mintRevertsWhenExceedingMaxSupply() public {
        uint256 overLimit = token.MAX_SUPPLY() + 1;
        vm.prank(owner);
        vm.expectRevert(EuroToken.EuroToken__MaxSupplyExceeded.selector);
        token.mint(alice, overLimit);
    }

    // ─── 3.8 Mint exactamente hasta MAX_SUPPLY ────────────────────────────────

    function test_mintExactlyToMaxSupply() public {
        uint256 cap = token.MAX_SUPPLY();
        vm.prank(owner);
        token.mint(alice, cap);

        assertEq(token.totalSupply(), cap);
        assertEq(token.balanceOf(alice), cap);
    }

    // ─── 3.9 Transfer entre cuentas ───────────────────────────────────────────

    function test_transferUpdatesBalances() public {
        uint256 mintAmount = 20_000_000; // 20 EURT
        uint256 transferAmount = 7_000_000; // 7 EURT

        vm.prank(owner);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        assertTrue(token.transfer(bob, transferAmount));

        assertEq(token.balanceOf(alice), mintAmount - transferAmount);
        assertEq(token.balanceOf(bob), transferAmount);
        assertEq(token.totalSupply(), mintAmount);
    }

    // ─── 3.10 Approve + transferFrom ──────────────────────────────────────────

    function test_approveAndTransferFrom() public {
        uint256 mintAmount = 50_000_000; // 50 EURT
        uint256 approveAmount = 15_000_000; // 15 EURT

        vm.prank(owner);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.approve(bob, approveAmount);
        assertEq(token.allowance(alice, bob), approveAmount);

        vm.prank(bob);
        assertTrue(token.transferFrom(alice, bob, approveAmount));

        assertEq(token.balanceOf(alice), mintAmount - approveAmount);
        assertEq(token.balanceOf(bob), approveAmount);
        assertEq(token.allowance(alice, bob), 0);
    }

    // ─── 3.11 Burn ────────────────────────────────────────────────────────────

    function test_burnReducesBalanceAndSupply() public {
        uint256 mintAmount = 10_000_000; // 10 EURT
        uint256 burnAmount = 3_000_000; // 3 EURT

        vm.prank(owner);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.burn(burnAmount);

        assertEq(token.balanceOf(alice), mintAmount - burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
    }

    // ─── 3.12 BurnFrom ────────────────────────────────────────────────────────

    function test_burnFromWithSufficientAllowance() public {
        uint256 mintAmount = 10_000_000; // 10 EURT
        uint256 burnAmount = 4_000_000; // 4 EURT

        vm.prank(owner);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.approve(bob, burnAmount);

        vm.prank(bob);
        token.burnFrom(alice, burnAmount);

        assertEq(token.balanceOf(alice), mintAmount - burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
        assertEq(token.allowance(alice, bob), 0);
    }

    function test_burnFromRevertsWithoutAllowance() public {
        uint256 mintAmount = 10_000_000;

        vm.prank(owner);
        token.mint(alice, mintAmount);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ERC20InsufficientAllowance(address,uint256,uint256)")),
                bob,
                0,
                mintAmount
            )
        );
        token.burnFrom(alice, mintAmount);
    }
}
