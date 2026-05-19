// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ProductLib} from "./ProductLib.sol";
import {CartLib} from "./CartLib.sol";

library InvoiceLib {

    struct InvoiceItem {
        uint256 productId;
        uint256 quantity;
        uint256 priceAtPurchase;
    }

    struct Invoice {
        address customerAddress;
        uint256 companyId;
        InvoiceItem[] items;
        uint256 totalAmount;
        bool isPaid;
        uint256 createdAt;
    }

    function create(
        mapping(uint256 => Invoice) storage invoices,
        mapping(address => uint256[]) storage invoicesByCustomer,
        mapping(uint256 => uint256[]) storage invoicesByCompany,
        mapping(uint256 => ProductLib.Product) storage products,
        uint256 invoiceId,
        address customerAddress,
        uint256 companyId,
        CartLib.CartItem[] memory cartItems
    ) internal returns (uint256 totalAmount) {
        require(cartItems.length > 0, "Cart is empty");

        Invoice storage inv = invoices[invoiceId];
        inv.customerAddress = customerAddress;
        inv.companyId = companyId;
        inv.createdAt = block.timestamp;

        for (uint256 i = 0; i < cartItems.length; i++) {
            uint256 pid = cartItems[i].productId;
            uint256 qty = cartItems[i].quantity;
            require(products[pid].stock >= qty, "Insufficient stock");

            uint256 priceAtPurchase = products[pid].price;
            inv.items.push(InvoiceItem({
                productId: pid,
                quantity: qty,
                priceAtPurchase: priceAtPurchase
            }));
            totalAmount += priceAtPurchase * qty;
            products[pid].stock -= qty;
        }

        inv.totalAmount = totalAmount;
        invoicesByCustomer[customerAddress].push(invoiceId);
        invoicesByCompany[companyId].push(invoiceId);
    }

    function getInvoice(
        mapping(uint256 => Invoice) storage invoices,
        uint256 invoiceId,
        uint256 invoiceCount
    ) internal view returns (Invoice storage) {
        require(invoiceId > 0 && invoiceId <= invoiceCount, "Invoice not found");
        return invoices[invoiceId];
    }

    function getByCustomer(
        mapping(address => uint256[]) storage invoicesByCustomer,
        address customerAddress
    ) internal view returns (uint256[] memory) {
        return invoicesByCustomer[customerAddress];
    }

    function getByCompany(
        mapping(uint256 => uint256[]) storage invoicesByCompany,
        uint256 companyId
    ) internal view returns (uint256[] memory) {
        return invoicesByCompany[companyId];
    }
}
