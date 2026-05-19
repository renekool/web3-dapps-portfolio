// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CompanyLib {

    struct Company {
        address companyAddress;
        string name;
        string description;
        bool isActive;
        uint256 registeredAt;
    }

    function register(
        mapping(uint256 => Company) storage companies,
        mapping(address => uint256) storage idByAddress,
        uint256 newId,
        address companyAddress,
        string calldata name,
        string calldata description
    ) internal {
        require(companyAddress != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name required");
        require(idByAddress[companyAddress] == 0, "Already registered");

        companies[newId] = Company({
            companyAddress: companyAddress,
            name: name,
            description: description,
            isActive: true,
            registeredAt: block.timestamp
        });
        idByAddress[companyAddress] = newId;
    }

    function getById(
        mapping(uint256 => Company) storage companies,
        uint256 id,
        uint256 companyCount
    ) internal view returns (Company memory) {
        require(id > 0 && id <= companyCount, "Company not found");
        return companies[id];
    }

    function getByAddress(
        mapping(uint256 => Company) storage companies,
        mapping(address => uint256) storage idByAddress,
        address companyAddress
    ) internal view returns (Company memory) {
        uint256 id = idByAddress[companyAddress];
        require(id != 0, "Company not found");
        return companies[id];
    }

    function activate(
        mapping(uint256 => Company) storage companies,
        uint256 id,
        uint256 companyCount
    ) internal {
        require(id > 0 && id <= companyCount, "Company not found");
        companies[id].isActive = true;
    }

    function deactivate(
        mapping(uint256 => Company) storage companies,
        uint256 id,
        uint256 companyCount
    ) internal {
        require(id > 0 && id <= companyCount, "Company not found");
        companies[id].isActive = false;
    }

    function update(
        mapping(uint256 => Company) storage companies,
        uint256 id,
        address companyAddress,
        string calldata name,
        string calldata description,
        uint256 companyCount
    ) internal {
        require(id > 0 && id <= companyCount, "Company not found");
        require(companyAddress != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name required");
        companies[id].name = name;
        companies[id].description = description;
        companies[id].companyAddress = companyAddress;
    }
}
