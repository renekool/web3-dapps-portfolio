// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CustomerLib {

    struct Customer {
        address customerAddress;
        uint256 registeredAt;
        bool isActive;
    }

    function ensureExists(
        mapping(address => Customer) storage customers,
        address customerAddress
    ) internal returns (bool wasCreated) {
        if (customers[customerAddress].registeredAt == 0) {
            customers[customerAddress] = Customer({
                customerAddress: customerAddress,
                registeredAt: block.timestamp,
                isActive: true
            });
            return true;
        }
        return false;
    }

    function getCustomer(
        mapping(address => Customer) storage customers,
        address customerAddress
    ) internal view returns (Customer memory) {
        require(customers[customerAddress].registeredAt != 0, "Customer not found");
        return customers[customerAddress];
    }

    function isRegistered(
        mapping(address => Customer) storage customers,
        address customerAddress
    ) internal view returns (bool) {
        return customers[customerAddress].registeredAt != 0;
    }
}
