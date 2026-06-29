import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Trash2, Calendar, Gavel, Play, RefreshCw, AlertTriangle, Sparkles, TrendingDown } from "lucide-react";
import { EAuction, Supplier, RequestForQuotation, formatINR } from "../../types";

interface AuctionsPanelProps {
  suppliers: Supplier[];
}

export default function AuctionsPanel({ suppliers }: AuctionsPanelProps) {
  const [auctions, setAuctions] = useState<EAuction[]>([]);
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Simulated Bid State
  const [liveAuctionId, setLiveAuctionId] = useState<string | null>(null);
  const [bidLogs, setBidLogs] = useState<Array<{ bidder: string; amount: number; time: string }>>([]);
  const [countdown, setCountdown] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form states matching Image 5
  const [auctionTitle, setAuctionTitle] = useState("");
  const [description, setDescription] = useState("");
  const [auctionType, setAuctionType] = useState("Reverse Auction (Price Decrements)");
  const [linkedRfqId, setLinkedRfqId] = useState("");
  const [startingPrice, setStartingPrice] = useState(0);
  const [reservePrice, setReservePrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [minBidStep, setMinBidStep] = useState(100);
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("IN INR (₹)");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_eauctions");
    if (stored) {
      try { setAuctions(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultAuctions: EAuction[] = [
        {
          id: "auc-1",
          auctionNumber: "AUC-2026-0001",
          title: "Kolkata Hub Solar Grid Battery Modules Sourcing",
          description: "Reverse auction for 100kW Lithium Iron Phosphate rechargeable battery rack systems.",
          auctionType: "Reverse Auction (Price Decrements)",
          startingPrice: 1800000,
          reservePrice: 1500000,
          quantity: 10,
          minBidStep: 5000,
          endDate: "2026-07-08T18:00",
          currency: "IN INR (₹)",
          invitedVendors: ["PowerCell Systems India", "Tata Solar Grid Sourcing"],
          status: "Live",
          lowestBid: 1750000,
          lowestBidder: "PowerCell Systems India",
          createdAt: "2026-06-28"
        }
      ];
      setAuctions(defaultAuctions);
      localStorage.setItem("deinrim_eauctions", JSON.stringify(defaultAuctions));
    }

    // Load RFQs for linking
    const storedRFQs = localStorage.getItem("deinrim_rfqs");
    if (storedRFQs) {
      try {
        const parsed: RequestForQuotation[] = JSON.parse(storedRFQs);
        setRfqs(parsed);
      } catch (e) {}
    }
  }, []);

  const saveAuctions = (updated: EAuction[]) => {
    setAuctions(updated);
    localStorage.setItem("deinrim_eauctions", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setAuctionTitle("");
    setDescription("");
    setAuctionType("Reverse Auction (Price Decrements)");
    setLinkedRfqId("");
    setStartingPrice(50000);
    setReservePrice(40000);
    setQuantity(1);
    setMinBidStep(500);
    setEndDate("");
    setCurrency("IN INR (₹)");
    setSelectedVendors([]);
    setShowAddModal(true);
  };

  const handleLinkRFQChange = (rfqId: string) => {
    setLinkedRfqId(rfqId);
    if (!rfqId) return;

    const rfq = rfqs.find(f => f.id === rfqId);
    if (rfq) {
      setAuctionTitle(`E-Auction for ${rfq.title}`);
      setDescription(`Reverse pricing auction linked to RFQ: ${rfq.rfqNumber}. Sourcing ${rfq.quantity} ${rfq.uom} of ${rfq.itemName}.`);
      setQuantity(rfq.quantity);
      setSelectedVendors(rfq.invitedVendors);
    }
  };

  const handleVendorCheckboxChange = (vendorName: string) => {
    if (selectedVendors.includes(vendorName)) {
      setSelectedVendors(selectedVendors.filter(v => v !== vendorName));
    } else {
      setSelectedVendors([...selectedVendors, vendorName]);
    }
  };

  const handleCreateAuction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auctionTitle || startingPrice <= 0 || !endDate || selectedVendors.length === 0) {
      alert("Please fill in all fields and invite at least one Vendor!");
      return;
    }

    const linkedRFQ = rfqs.find(f => f.id === linkedRfqId);

    const newAuction: EAuction = {
      id: `auc-${Date.now()}`,
      auctionNumber: `AUC-2026-000${auctions.length + 1}`,
      title: auctionTitle,
      description,
      auctionType,
      linkedRfqId: linkedRfqId || undefined,
      linkedRfqNumber: linkedRFQ?.rfqNumber || undefined,
      startingPrice: Number(startingPrice),
      reservePrice: Number(reservePrice),
      quantity: Number(quantity),
      minBidStep: Number(minBidStep),
      endDate,
      currency,
      invitedVendors: selectedVendors,
      status: "Upcoming",
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newAuction, ...auctions];
    saveAuctions(updated);
    setShowAddModal(false);

    // Write audit trail entry
    const auditLogs = localStorage.getItem("deinrim_auditLogs_comp-1");
    if (auditLogs) {
      try {
        const parsed = JSON.parse(auditLogs);
        const newAudit = {
          id: `audit-${Date.now()}`,
          userId: "user-1",
          userName: "Finance Administrator",
          userRole: "COMPANY_ADMIN",
          action: "CREATED",
          module: "E_AUCTION",
          details: `Scheduled reverse bidding e-Auction ${newAuction.auctionNumber} with opening bids starting at ${formatINR(newAuction.startingPrice)}`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify([newAudit, ...parsed]));
      } catch (err) {}
    }
  };

  // Live Auction Simulation Engine
  const startSimulation = (auction: EAuction) => {
    setLiveAuctionId(auction.id);
    setBidLogs([]);
    setCountdown(15);
    let currentLowest = auction.lowestBid || auction.startingPrice;
    let currentBidder = auction.lowestBidder || "Opening Price";

    if (timerRef.current) clearInterval(timerRef.current);

    const vendors = auction.invitedVendors.length > 0 ? auction.invitedVendors : ["PowerCell Systems India", "Tata Solar Grid Sourcing", "Global Hardware Distributors"];

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Set completed status
          const finalBids = [...bidLogs];
          const finalLowest = currentLowest;
          const finalLowestBidder = currentBidder;
          
          setAuctions(prevAuc => prevAuc.map(a => {
            if (a.id === auction.id) {
              return {
                ...a,
                lowestBid: finalLowest,
                lowestBidder: finalLowestBidder,
                status: "Completed" as const
              };
            }
            return a;
          }));

          alert(`E-Auction completed! Winning low bid: ${formatINR(finalLowest)} by ${finalLowestBidder}`);
          setLiveAuctionId(null);
          return 0;
        }

        // 40% chance of a new bid on this tick
        if (Math.random() < 0.6) {
          const bidder = vendors[Math.floor(Math.random() * vendors.length)];
          const drop = auction.minBidStep + Math.floor(Math.random() * 4) * auction.minBidStep;
          const testNew = currentLowest - drop;
          
          if (testNew >= auction.reservePrice) {
            currentLowest = testNew;
            currentBidder = bidder;

            setBidLogs(logs => [
              { bidder, amount: testNew, time: new Date().toLocaleTimeString() },
              ...logs
            ]);

            // Real-time update in general state
            setAuctions(prevAuc => prevAuc.map(a => {
              if (a.id === auction.id) {
                return {
                  ...a,
                  status: "Live",
                  lowestBid: testNew,
                  lowestBidder: bidder
                };
              }
              return a;
            }));
          }
        }

        return prev - 1;
      });
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to retract/delete this e-Auction?")) {
      const updated = auctions.filter(a => a.id !== id);
      saveAuctions(updated);
    }
  };

  const filtered = auctions.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.auctionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search E-Auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create E-Auction</span>
        </button>
      </div>

      {/* Live Auction Dashboard banner */}
      {liveAuctionId && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-4 text-xs flex flex-col md:flex-row justify-between gap-4 animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <strong className="text-white font-bold uppercase tracking-wider font-mono text-[10px]">LIVE REVERSE AUCTION TICKER</strong>
            </div>
            <h4 className="text-xs text-slate-200 font-bold">{auctions.find(a => a.id === liveAuctionId)?.title}</h4>
            <div className="text-indigo-300 font-mono">
              Countdown to close: <strong className="text-white text-sm">{countdown}s</strong>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex-1 max-w-xs h-28 overflow-y-auto text-[9px] font-mono font-semibold text-slate-400 space-y-1">
            <span className="block border-b border-slate-800 pb-1 text-slate-300 font-bold text-center">LIVE BID LOGS</span>
            {bidLogs.map((log, i) => (
              <div key={i} className="flex justify-between text-emerald-400">
                <span>{log.bidder}:</span>
                <span className="font-bold">{formatINR(log.amount)} <span className="text-slate-500 font-normal">({log.time})</span></span>
              </div>
            ))}
            {bidLogs.length === 0 && (
              <div className="text-center text-slate-500 py-4">Waiting for incoming vendor bids...</div>
            )}
          </div>
        </div>
      )}

      {/* E-Auction cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No dynamic E-Auctions planned or running.
          </div>
        ) : (
          filtered.map(auc => (
            <div key={auc.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-indigo-400 font-bold">{auc.auctionNumber}</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono bg-slate-950 px-1 py-0.2 rounded border border-slate-800 uppercase">{auc.auctionType}</span>
                  </div>
                  <strong className="text-white text-xs block leading-snug">{auc.title}</strong>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  auc.status === "Live" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  auc.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {auc.status}
                </span>
              </div>

              {auc.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed truncate max-w-sm">{auc.description}</p>
              )}

              <div className="space-y-1.5 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2 border border-slate-850 rounded">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-mono">Opening Bid Limit</span>
                    <span className="text-slate-200 font-mono font-bold text-xs">{formatINR(auc.startingPrice)}</span>
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-850 rounded">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-mono">Target Low Reserve</span>
                    <span className="text-slate-200 font-mono font-bold text-xs">{formatINR(auc.reservePrice)}</span>
                  </div>
                </div>

                <div className="bg-emerald-950/15 p-2 border border-emerald-500/15 rounded flex justify-between items-center mt-1">
                  <div>
                    <span className="block text-[8px] text-emerald-500 uppercase tracking-widest font-mono font-bold">Current Low Bid</span>
                    <span className="text-emerald-400 font-mono font-bold text-xs">
                      {auc.lowestBid ? formatINR(auc.lowestBid) : "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-mono">Lowest Bidder</span>
                    <span className="text-slate-200 font-semibold text-[10px]">
                      {auc.lowestBidder || "No bids placed"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500">
                  <div>Qty Required: <span className="text-slate-300 font-bold">{auc.quantity} units</span></div>
                  <div>Min Bid Drop: <span className="text-slate-300 font-bold">{formatINR(auc.minBidStep)}</span></div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                  <span>Closes: <span className="text-indigo-300 font-mono">{new Date(auc.endDate).toLocaleString()}</span></span>
                  <span>Currency: <span className="text-indigo-400 font-mono font-bold">{auc.currency}</span></span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-1">
                <div className="flex items-center gap-1.5">
                  {auc.status !== "Completed" && !liveAuctionId && (
                    <button
                      onClick={() => startSimulation(auc)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Simulate Live Bids</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(auc.id)}
                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create E-Auction Modal matching Image 5 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateAuction}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Gavel className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create E-Auction
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Auction Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY27 Solar Battery Grid Reverse Auction"
                  value={auctionTitle}
                  onChange={(e) => setAuctionTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Item Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed technical overview, compliance standards required..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Auction Type *</label>
                  <select
                    value={auctionType}
                    onChange={(e) => setAuctionType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="Reverse Auction (Price Decrements)">Reverse Auction</option>
                    <option value="Dutch Auction (Price Increments)">Dutch Auction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Linked RFQ <span className="text-slate-500 font-normal lowercase">(optional)</span></label>
                  <select
                    value={linkedRfqId}
                    onChange={(e) => handleLinkRFQChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="">-- Select Linked RFQ --</option>
                    {rfqs.map(r => <option key={r.id} value={r.id}>{r.rfqNumber} - {r.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Starting Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Target Reserve Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={reservePrice}
                    onChange={(e) => setReservePrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono text-[9px]">Min Bid Step *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={minBidStep}
                    onChange={(e) => setMinBidStep(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono text-[9px]">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="IN INR (₹)">IN INR (₹)</option>
                    <option value="US USD ($)">US USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold font-mono">Invite Bidding Vendors *</label>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-24 overflow-y-auto space-y-1 text-xs text-slate-300 font-semibold">
                  {suppliers.map(sup => (
                    <label key={sup.id} className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(sup.name)}
                        onChange={() => handleVendorCheckboxChange(sup.name)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{sup.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
              >
                Schedule Auction
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
