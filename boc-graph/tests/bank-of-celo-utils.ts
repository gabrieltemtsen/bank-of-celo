import { newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import {
  BlacklistUpdated,
  Claimed,
  Donated,
  DonorTierUpgraded,
  EIP712DomainChanged,
  GaslessClaimExecuted,
  LeaderboardUpdated,
  OwnershipTransferred,
} from "../generated/BankOfCelo/BankOfCelo";

export function createBlacklistUpdatedEvent(
  fids: Array<BigInt>,
  isBlacklisted: boolean,
): BlacklistUpdated {
  let blacklistUpdatedEvent = changetype<BlacklistUpdated>(newMockEvent());

  blacklistUpdatedEvent.parameters = new Array();

  blacklistUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "fids",
      ethereum.Value.fromUnsignedBigIntArray(fids),
    ),
  );
  blacklistUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "isBlacklisted",
      ethereum.Value.fromBoolean(isBlacklisted),
    ),
  );

  return blacklistUpdatedEvent;
}

export function createClaimedEvent(
  recipient: Address,
  fid: BigInt,
  amount: BigInt,
): Claimed {
  let claimedEvent = changetype<Claimed>(newMockEvent());

  claimedEvent.parameters = new Array();

  claimedEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient)),
  );
  claimedEvent.parameters.push(
    new ethereum.EventParam("fid", ethereum.Value.fromUnsignedBigInt(fid)),
  );
  claimedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );

  return claimedEvent;
}

export function createDonatedEvent(
  donor: Address,
  amount: BigInt,
  devFee: BigInt,
): Donated {
  let donatedEvent = changetype<Donated>(newMockEvent());

  donatedEvent.parameters = new Array();

  donatedEvent.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor)),
  );
  donatedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );
  donatedEvent.parameters.push(
    new ethereum.EventParam(
      "devFee",
      ethereum.Value.fromUnsignedBigInt(devFee),
    ),
  );

  return donatedEvent;
}

export function createDonorTierUpgradedEvent(
  donor: Address,
  newTier: i32,
): DonorTierUpgraded {
  let donorTierUpgradedEvent = changetype<DonorTierUpgraded>(newMockEvent());

  donorTierUpgradedEvent.parameters = new Array();

  donorTierUpgradedEvent.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor)),
  );
  donorTierUpgradedEvent.parameters.push(
    new ethereum.EventParam(
      "newTier",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newTier)),
    ),
  );

  return donorTierUpgradedEvent;
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent =
    changetype<EIP712DomainChanged>(newMockEvent());

  eip712DomainChangedEvent.parameters = new Array();

  return eip712DomainChangedEvent;
}

export function createGaslessClaimExecutedEvent(
  operator: Address,
  claimer: Address,
  fid: BigInt,
): GaslessClaimExecuted {
  let gaslessClaimExecutedEvent =
    changetype<GaslessClaimExecuted>(newMockEvent());

  gaslessClaimExecutedEvent.parameters = new Array();

  gaslessClaimExecutedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator)),
  );
  gaslessClaimExecutedEvent.parameters.push(
    new ethereum.EventParam("claimer", ethereum.Value.fromAddress(claimer)),
  );
  gaslessClaimExecutedEvent.parameters.push(
    new ethereum.EventParam("fid", ethereum.Value.fromUnsignedBigInt(fid)),
  );

  return gaslessClaimExecutedEvent;
}

export function createLeaderboardUpdatedEvent(
  donor: Address,
  amount: BigInt,
  position: BigInt,
): LeaderboardUpdated {
  let leaderboardUpdatedEvent = changetype<LeaderboardUpdated>(newMockEvent());

  leaderboardUpdatedEvent.parameters = new Array();

  leaderboardUpdatedEvent.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor)),
  );
  leaderboardUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );
  leaderboardUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "position",
      ethereum.Value.fromUnsignedBigInt(position),
    ),
  );

  return leaderboardUpdatedEvent;
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address,
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent());

  ownershipTransferredEvent.parameters = new Array();

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner),
    ),
  );
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner)),
  );

  return ownershipTransferredEvent;
}
