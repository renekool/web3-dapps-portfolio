// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/CompanyLib.sol";
import "./mocks/MockEuroToken.sol";

contract CompanyTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    function setUp() public {
        owner = makeAddr("owner");
        companyAddr = makeAddr("company1");
        customerAddr = makeAddr("customer1");

        vm.startPrank(owner);
        mockToken = new MockEuroToken();
        ecommerce = new Ecommerce(address(mockToken));
        vm.stopPrank();
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_registerCompany_success() public {
        vm.prank(companyAddr);
        vm.expectEmit(true, true, false, true);
        emit Ecommerce.CompanyRegistered(1, companyAddr, "Acme Corp");
        ecommerce.registerCompany("Acme Corp", "Description");

        CompanyLib.Company memory c = ecommerce.getCompanyById(1);
        assertEq(c.companyAddress, companyAddr);
        assertEq(c.name, "Acme Corp");
        assertTrue(c.isActive);
        assertGt(c.registeredAt, 0);
        assertEq(ecommerce.companyCount(), 1);
    }

    function test_getCompanyById_returnsCorrectData() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        CompanyLib.Company memory c = ecommerce.getCompanyById(1);
        assertEq(c.name, "Acme Corp");
        assertEq(c.companyAddress, companyAddr);
    }

    function test_getCompanyByAddress_returnsCorrectData() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        CompanyLib.Company memory c = ecommerce.getCompanyByAddress(companyAddr);
        assertEq(c.name, "Acme Corp");
    }

    function test_toggleCompanyStatus_setsActiveAndEmitsEvent() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.startPrank(owner);
        ecommerce.toggleCompanyStatus(1);

        vm.expectEmit(true, false, false, false);
        emit Ecommerce.CompanyActivated(1);
        ecommerce.toggleCompanyStatus(1);
        vm.stopPrank();

        CompanyLib.Company memory c = ecommerce.getCompanyById(1);
        assertTrue(c.isActive);
    }

    function test_toggleCompanyStatus_setsInactiveAndEmitsEvent() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.startPrank(owner);
        vm.expectEmit(true, false, false, false);
        emit Ecommerce.CompanyDeactivated(1);
        ecommerce.toggleCompanyStatus(1);
        vm.stopPrank();

        CompanyLib.Company memory c = ecommerce.getCompanyById(1);
        assertFalse(c.isActive);
    }

    function test_deactivatedCompany_stillQueryable() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(owner);
        ecommerce.toggleCompanyStatus(1);

        CompanyLib.Company memory c = ecommerce.getCompanyById(1);
        assertEq(c.name, "Acme Corp");
        assertFalse(c.isActive);
    }

    // ── Access control reverts ─────────────────────────────────────────────────

    function test_activateDetoggleCompanyStatus_revert_notOwner() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(customerAddr);
        vm.expectRevert("Not owner");
        ecommerce.toggleCompanyStatus(1);

        vm.prank(customerAddr);
        vm.expectRevert("Not owner");
        ecommerce.toggleCompanyStatus(1);
    }

    // ── Input validation reverts ──────────────────────────────────────────────

    function test_registerCompany_revert_emptyName() public {
        vm.prank(companyAddr);
        vm.expectRevert("Name required");
        ecommerce.registerCompany("", "Description");
    }

    function test_registerCompany_revert_alreadyRegistered() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(companyAddr);
        vm.expectRevert("Already registered");
        ecommerce.registerCompany("Acme Corp 2", "Description");
    }

    function test_getCompanyById_revert_invalidId() public {
        vm.expectRevert("Company not found");
        ecommerce.getCompanyById(0);

        vm.expectRevert("Company not found");
        ecommerce.getCompanyById(999);
    }

    function test_getCompanyByAddress_revert_notRegistered() public {
        vm.expectRevert("Company not found");
        ecommerce.getCompanyByAddress(companyAddr);
    }
}
