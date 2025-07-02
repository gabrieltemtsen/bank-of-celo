/* eslint-disable prefer-const */
import {
  RoundAdvanced as RoundAdvancedEvent,
  TicketPurchased as TicketPurchasedEvent,
  WinnerSelected as WinnerSelectedEvent,
  WinningsClaimed as WinningsClaimedEvent,
} from "../generated/CeloJackpot/CeloJackpot";
import {
  RoundAdvanced,
  TicketPurchased,
  WinnerSelected,
  WinningsClaimed,
  GasStat,
} from "../generated/schema";

export function handleRoundAdvanced(event: RoundAdvancedEvent): void {
  let entity = new RoundAdvanced(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.newRoundId = event.params.newRoundId;
  entity.carryOverPot = event.params.carryOverPot;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTicketPurchased(event: TicketPurchasedEvent): void {
  let entity = new TicketPurchased(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  let tx = event.transaction;
  let receipt = event.receipt;

  if (tx && receipt) {
    let id = event.transaction.hash.toHex();
    let gasUsed = receipt.gasUsed;
    let gasPrice = tx.gasPrice;
    let gasFee = gasUsed.times(gasPrice);

    let stat = new GasStat(id);
    stat.user = tx.from;
    stat.blockNumber = event.block.number;
    stat.timestamp = event.block.timestamp;
    stat.txHash = event.transaction.hash;
    stat.gasUsed = gasUsed;
    stat.gasPrice = gasPrice;
    stat.gasFee = gasFee;
    stat.save();
  }
  entity.buyer = event.params.buyer;
  entity.roundId = event.params.roundId;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWinnerSelected(event: WinnerSelectedEvent): void {
  let entity = new WinnerSelected(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.roundId = event.params.roundId;
  entity.winner = event.params.winner;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWinningsClaimed(event: WinningsClaimedEvent): void {
  let entity = new WinningsClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.roundId = event.params.roundId;
  entity.winner = event.params.winner;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
