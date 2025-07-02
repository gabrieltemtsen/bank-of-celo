import { newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import {
  RoundAdvanced,
  TicketPurchased,
  WinnerSelected,
  WinningsClaimed,
} from "../generated/CeloJackpot/CeloJackpot";

export function createRoundAdvancedEvent(
  newRoundId: BigInt,
  carryOverPot: BigInt,
): RoundAdvanced {
  let roundAdvancedEvent = changetype<RoundAdvanced>(newMockEvent());

  roundAdvancedEvent.parameters = new Array();

  roundAdvancedEvent.parameters.push(
    new ethereum.EventParam(
      "newRoundId",
      ethereum.Value.fromUnsignedBigInt(newRoundId),
    ),
  );
  roundAdvancedEvent.parameters.push(
    new ethereum.EventParam(
      "carryOverPot",
      ethereum.Value.fromUnsignedBigInt(carryOverPot),
    ),
  );

  return roundAdvancedEvent;
}

export function createTicketPurchasedEvent(
  buyer: Address,
  roundId: BigInt,
  amount: BigInt,
): TicketPurchased {
  let ticketPurchasedEvent = changetype<TicketPurchased>(newMockEvent());

  ticketPurchasedEvent.parameters = new Array();

  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer)),
  );
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId),
    ),
  );
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );

  return ticketPurchasedEvent;
}

export function createWinnerSelectedEvent(
  roundId: BigInt,
  winner: Address,
  amount: BigInt,
): WinnerSelected {
  let winnerSelectedEvent = changetype<WinnerSelected>(newMockEvent());

  winnerSelectedEvent.parameters = new Array();

  winnerSelectedEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId),
    ),
  );
  winnerSelectedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner)),
  );
  winnerSelectedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );

  return winnerSelectedEvent;
}

export function createWinningsClaimedEvent(
  roundId: BigInt,
  winner: Address,
  amount: BigInt,
): WinningsClaimed {
  let winningsClaimedEvent = changetype<WinningsClaimed>(newMockEvent());

  winningsClaimedEvent.parameters = new Array();

  winningsClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId),
    ),
  );
  winningsClaimedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner)),
  );
  winningsClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );

  return winningsClaimedEvent;
}
