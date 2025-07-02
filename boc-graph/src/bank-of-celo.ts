/* eslint-disable prefer-const */
import {
  BlacklistUpdated as BlacklistUpdatedEvent,
  Claimed as ClaimedEvent,
  Donated as DonatedEvent,
  DonorTierUpgraded as DonorTierUpgradedEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  GaslessClaimExecuted as GaslessClaimExecutedEvent,
  LeaderboardUpdated as LeaderboardUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
} from "../generated/BankOfCelo/BankOfCelo";
import {
  BlacklistUpdated,
  Claimed,
  Donated,
  DonorTierUpgraded,
  EIP712DomainChanged,
  GaslessClaimExecuted,
  LeaderboardUpdated,
  OwnershipTransferred,
  GasStat,
} from "../generated/schema";

export function handleBlacklistUpdated(event: BlacklistUpdatedEvent): void {
  let entity = new BlacklistUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.fids = event.params.fids;
  entity.isBlacklisted = event.params.isBlacklisted;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleClaimed(event: ClaimedEvent): void {
  let entity = new Claimed(
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
  entity.recipient = event.params.recipient;
  entity.fid = event.params.fid;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleDonated(event: DonatedEvent): void {
  let entity = new Donated(
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
  entity.donor = event.params.donor;
  entity.amount = event.params.amount;
  entity.devFee = event.params.devFee;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleDonorTierUpgraded(event: DonorTierUpgradedEvent): void {
  let entity = new DonorTierUpgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.donor = event.params.donor;
  entity.newTier = event.params.newTier;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent,
): void {
  let entity = new EIP712DomainChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleGaslessClaimExecuted(
  event: GaslessClaimExecutedEvent,
): void {
  let entity = new GaslessClaimExecuted(
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
  entity.operator = event.params.operator;
  entity.claimer = event.params.claimer;
  entity.fid = event.params.fid;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLeaderboardUpdated(event: LeaderboardUpdatedEvent): void {
  let entity = new LeaderboardUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.donor = event.params.donor;
  entity.amount = event.params.amount;
  entity.position = event.params.position;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
