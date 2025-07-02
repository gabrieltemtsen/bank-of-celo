import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { RoundAdvanced } from "../generated/schema";
import { RoundAdvanced as RoundAdvancedEvent } from "../generated/CeloJackpot/CeloJackpot";
import { handleRoundAdvanced } from "../src/celo-jackpot";
import { createRoundAdvancedEvent } from "./celo-jackpot-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let newRoundId = BigInt.fromI32(234);
    let carryOverPot = BigInt.fromI32(234);
    let newRoundAdvancedEvent = createRoundAdvancedEvent(
      newRoundId,
      carryOverPot,
    );
    handleRoundAdvanced(newRoundAdvancedEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("RoundAdvanced created and stored", () => {
    assert.entityCount("RoundAdvanced", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "RoundAdvanced",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newRoundId",
      "234",
    );
    assert.fieldEquals(
      "RoundAdvanced",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "carryOverPot",
      "234",
    );

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  });
});
