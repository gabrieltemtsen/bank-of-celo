import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { BottomSheet } from "../../components/bottomSheet";
import { Button } from "~/components/ui/Button";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { Loader2, Sparkles, Trophy } from "lucide-react";

interface SpinTheWheelSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WheelSegment {
    id: string;
    label: string;
    value: number;
    color: string;
    probability: number; // 0-1
}

const SEGMENTS: WheelSegment[] = [
    { id: "1", label: "10 Pts", value: 10, color: "#3b82f6", probability: 0.4 },
    { id: "2", label: "50 Pts", value: 50, color: "#8b5cf6", probability: 0.3 },
    { id: "3", label: "Try Again", value: 0, color: "#ef4444", probability: 0.2 },
    { id: "4", label: "100 Pts", value: 100, color: "#10b981", probability: 0.09 },
    { id: "5", label: "JACKPOT", value: 1000, color: "#f59e0b", probability: 0.01 },
];

const WHEEL_SIZE = 300;

export default function SpinTheWheelSheet({ isOpen, onClose }: SpinTheWheelSheetProps) {
    const { mode } = useChainMode();
    const isDegen = mode === "degen";
    const controls = useAnimation();
    const [isSpinning, setIsSpinning] = useState(false);
    const [canSpin, setCanSpin] = useState(true);
    const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
    const [reward, setReward] = useState<WheelSegment | null>(null);

    // Load spin status from local storage
    useEffect(() => {
        const stored = localStorage.getItem("lastSpinTime");
        if (stored) {
            const time = parseInt(stored, 10);
            setLastSpinTime(time);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - time < oneDay) {
                setCanSpin(false);
            }
        }
    }, [isOpen]);

    const spinWheel = async () => {
        if (!canSpin || isSpinning) return;

        setIsSpinning(true);
        setReward(null);

        // Determine result based on probability
        const rand = Math.random();
        let cumulativeProb = 0;
        let selectedSegment = SEGMENTS[0];

        for (const segment of SEGMENTS) {
            cumulativeProb += segment.probability;
            if (rand <= cumulativeProb) {
                selectedSegment = segment;
                break;
            }
        }

        // Calculate rotation
        // 5 segments = 72 degrees each
        // We want to land on the selected segment
        // The wheel starts with segment 0 at the top (if we rotate it correctly)
        // Let's assume standard position: 0 degrees is right (3 o'clock).
        // We'll rotate the wheel container.

        const segmentAngle = 360 / SEGMENTS.length;
        const segmentIndex = SEGMENTS.indexOf(selectedSegment);

        // Add extra rotations for effect (e.g., 5 full spins)
        const extraSpins = 5 * 360;

        // Calculate target angle to land the segment at the top (270 degrees or -90)
        // If segment is at index i, its center is at i * segmentAngle
        // We want (currentRotation + targetRotation) % 360 to align the segment to the pointer
        // Let's simplify: just rotate to a specific value.

        // Randomize slightly within the segment
        const randomOffset = Math.random() * (segmentAngle - 10) - (segmentAngle / 2 - 5);

        // The pointer is usually at the top (270deg).
        // If we rotate the wheel CLOCKWISE, the segments move past the pointer.
        // Target rotation = extraSpins + (360 - (segmentIndex * segmentAngle)) + offset
        // We add a random offset to make it look natural.

        const targetRotation = extraSpins + (360 - (segmentIndex * segmentAngle)) + randomOffset;

        await controls.start({
            rotate: targetRotation,
            transition: { duration: 4, ease: "circOut" },
        });

        // Spin complete
        setIsSpinning(false);
        setReward(selectedSegment);

        // Save to local storage
        const now = Date.now();
        localStorage.setItem("lastSpinTime", now.toString());
        setLastSpinTime(now);
        setCanSpin(false);

        if (selectedSegment.value > 0) {
            toast.success(`You won ${selectedSegment.label}!`);
        } else {
            toast.info("Better luck next time!");
        }
    };

    const timeUntilNextSpin = () => {
        if (!lastSpinTime) return "";
        const nextSpin = lastSpinTime + 24 * 60 * 60 * 1000;
        const diff = nextSpin - Date.now();
        if (diff <= 0) return "Ready!";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isDegen ? "Degen Spin" : "Daily Bonus"}
            className="max-h-[90vh] overflow-y-auto"
        >
            <div className="flex flex-col items-center p-4 pb-8">
                <div className="relative mb-8">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className={cn(
                            "w-8 h-8 rotate-45 transform border-4",
                            isDegen ? "bg-fuchsia-500 border-purple-900" : "bg-yellow-400 border-white shadow-md"
                        )} />
                    </div>

                    {/* Wheel Container */}
                    <motion.div
                        className="relative rounded-full overflow-hidden shadow-xl border-4 border-gray-200"
                        style={{
                            width: WHEEL_SIZE,
                            height: WHEEL_SIZE,
                            borderColor: isDegen ? "#4c1d95" : "#e5e7eb"
                        }}
                        animate={controls}
                    >
                        {SEGMENTS.map((segment, index) => {
                            const rotation = index * (360 / SEGMENTS.length);
                            return (
                                <div
                                    key={segment.id}
                                    className="absolute top-0 left-1/2 w-full h-full origin-bottom-left"
                                    style={{
                                        transform: `rotate(${rotation}deg) skewY(-${90 - 360 / SEGMENTS.length}deg)`,
                                        transformOrigin: "50% 50%",
                                        clipPath: "polygon(50% 50%, 50% 0%, 100% 0%)", // Approximate slice
                                        // Using a simpler approach: Conic gradient is easier for the background, 
                                        // but for labels we need rotation.
                                        // Let's try a different CSS approach for slices or just use a conic gradient background and rotate labels.
                                    }}
                                >
                                    {/* This CSS slice method is tricky. Let's use a conic gradient for the wheel background 
                      and just place labels absolutely. */}
                                </div>
                            );
                        })}

                        {/* Alternative: Conic Gradient Background */}
                        <div
                            className="absolute inset-0 w-full h-full rounded-full"
                            style={{
                                background: `conic-gradient(
                  ${SEGMENTS.map((s, i) => `${s.color} ${i * (100 / SEGMENTS.length)}% ${(i + 1) * (100 / SEGMENTS.length)}%`).join(", ")}
                )`
                            }}
                        />

                        {/* Labels */}
                        {SEGMENTS.map((segment, index) => {
                            const angle = index * (360 / SEGMENTS.length) + (360 / SEGMENTS.length) / 2;
                            return (
                                <div
                                    key={segment.id}
                                    className="absolute top-0 left-0 w-full h-full flex justify-center pt-4"
                                    style={{
                                        transform: `rotate(${angle}deg)`,
                                    }}
                                >
                                    <span className="text-white font-bold text-sm drop-shadow-md transform -rotate-90 mt-8">
                                        {segment.label}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Center Cap */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg z-10 flex items-center justify-center">
                            <div className={cn("w-8 h-8 rounded-full", isDegen ? "bg-purple-600" : "bg-yellow-400")} />
                        </div>
                    </motion.div>
                </div>

                {/* Status / Reward Display */}
                <div className="text-center mb-6 h-16">
                    {reward ? (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <Trophy className={cn("w-8 h-8", isDegen ? "text-fuchsia-400" : "text-yellow-500")} />
                            <h3 className="text-xl font-bold">
                                {reward.value > 0 ? `You won ${reward.label}!` : "Try Again Tomorrow!"}
                            </h3>
                        </motion.div>
                    ) : (
                        <p className="text-gray-500">
                            {canSpin ? "Spin to win daily rewards!" : `Next spin in: ${timeUntilNextSpin()}`}
                        </p>
                    )}
                </div>

                {/* Spin Button */}
                <Button
                    onClick={spinWheel}
                    disabled={!canSpin || isSpinning}
                    className={cn(
                        "w-full py-4 text-lg font-bold rounded-xl transition-all transform active:scale-95",
                        isDegen
                            ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                            : "bg-yellow-400 hover:bg-yellow-300 text-black shadow-md border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1",
                        (!canSpin || isSpinning) && "opacity-50 cursor-not-allowed shadow-none border-none"
                    )}
                >
                    {isSpinning ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : canSpin ? (
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span>SPIN NOW</span>
                        </div>
                    ) : (
                        "Come Back Tomorrow"
                    )}
                </Button>
            </div>
        </BottomSheet>
    );
}
