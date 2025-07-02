import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { BlacklistUpdated } from "../generated/schema";
import { BlacklistUpdated as BlacklistUpdatedEvent } from "../generated/BankOfCelo/BankOfCelo";
import { handleBlacklistUpdated } from "../src/bank-of-celo";
import { createBlacklistUpdatedEvent } from "./bank-of-celo-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let fids = [BigInt.fromI32(234)];
    let isBlacklisted = "boolean Not implemented";
    let newBlacklistUpdatedEvent = createBlacklistUpdatedEvent(
      fids,
      isBlacklisted,
    );
    handleBlacklistUpdated(newBlacklistUpdatedEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("BlacklistUpdated created and stored", () => {
    assert.entityCount("BlacklistUpdated", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BlacklistUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fids",
      "[234]",
    );
    assert.fieldEquals(
      "BlacklistUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "isBlacklisted",
      "boolean Not implemented",
    );

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  });
});
