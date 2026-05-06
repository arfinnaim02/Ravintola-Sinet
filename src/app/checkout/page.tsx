"use client";

import { useEffect, useMemo, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import CartSummary from "../../components/CartSummary";
import { useCart } from "../../contexts/CartContext";
import DeliveryLocationModal from "../../components/DeliveryLocationModal";
import { useLanguage } from "../../i18n/LanguageContext";
const libraries: "places"[] = ["places"];
type SavedAddress = {
  id: string;
  label: string;
  addressLabel: string;
  addressExtra: string;
  lat: number;
  lng: number;
  distanceKm: number;
  isDefault: boolean;
};

type CheckoutUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type AppliedCoupon = {
  code: string;
  discountType: string;
  discountValue: number;
  discount: number;
};

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { cart, totalPrice, clearCart } = useCart();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || "",
    libraries,
  });

  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [locationPopupOpen, setLocationPopupOpen] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [addressLabel, setAddressLabel] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationText, setDurationText] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoTitle, setPromoTitle] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");
  const [savedAddressLoading, setSavedAddressLoading] = useState(false);

  const [user, setUser] = useState<CheckoutUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);


  const couponDiscount = appliedCoupon?.discount || 0;

  const finalTotal = useMemo(() => {
    return Math.max(0, totalPrice + deliveryFee - couponDiscount);
  }, [totalPrice, deliveryFee, couponDiscount]);

  async function calculateDeliveryFromLocation(
    selectedAddress: string,
    positionLat: number,
    positionLng: number
  ) {
    setLocationLoading(true);
    setLocationMessage("");
    setAppliedCoupon(null);
    setCouponMessage("");

    try {
      const response = await fetch("/api/delivery/google-distance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: positionLat,
          lng: positionLng,
          subtotal: totalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("checkoutDeliveryFailed"));
      }

      setAddressLabel(selectedAddress);
      setLat(Number(data.lat || 0));
      setLng(Number(data.lng || 0));
      setDistanceKm(Number(data.distanceKm || 0));
      setDurationText(data.durationText || "");
      setDeliveryFee(Number(data.deliveryFee || 0));
      setPromoApplied(Boolean(data.promoApplied));
      setPromoTitle(data.promoTitle || "");
      setDeliveryConfirmed(true);
      setLocationPopupOpen(false);
      setLocationMessage(t("checkoutDeliveryConfirmed"));
    } catch (error: any) {
      setDeliveryConfirmed(false);
      setDeliveryFee(0);
      setLocationMessage(error?.message || t("checkoutDeliveryFailed"));
    } finally {
      setLocationLoading(false);
    }
  }

  async function useSavedAddress(addressId: string) {
  const address = savedAddresses.find((item) => item.id === addressId);

  if (!address) return;

  setSelectedSavedAddressId(address.id);
  setAddressLabel(address.addressLabel);
  setLat(address.lat);
  setLng(address.lng);
  setDistanceKm(address.distanceKm);
  const extraInput = document.querySelector<HTMLInputElement>(
  'input[name="addressExtra"]'
);

if (extraInput) {
  extraInput.value = address.addressExtra || "";
}
  setDeliveryConfirmed(false);
  setAppliedCoupon(null);
  setCouponMessage("");

  await calculateDeliveryFromLocation(
    address.addressLabel,
    address.lat,
    address.lng
  );
}

  function handlePlaceChanged() {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();

    if (!place.geometry?.location) {
      setLocationMessage(t("checkoutSelectAddressSuggestion"));
      return;
    }

    const selectedAddress =
      place.formatted_address || place.name || addressLabel || "";

    calculateDeliveryFromLocation(
      selectedAddress,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  }

  async function applyCoupon() {
    setCouponLoading(true);
    setCouponMessage("");
    setAppliedCoupon(null);

    try {
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          subtotal: totalPrice,
          deliveryFee,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("checkoutInvalidCoupon"));
      }

      setAppliedCoupon(data.coupon);
      setCouponMessage(
        `${t("checkoutClaimedCouponApplied")}: -€${Number(data.coupon.discount).toFixed(2)}`
      );
    } catch (error: any) {
      setCouponMessage(error?.message || "Failed to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function applyClaimedCoupon(code: string) {
  setCouponLoading(true);
  setCouponMessage("");
  setAppliedCoupon(null);

  try {
    const response = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        subtotal: totalPrice,
        deliveryFee,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Invalid coupon.");
    }

    setCouponCode(code);
    setAppliedCoupon(data.coupon);
    setCouponMessage(
      `Claimed coupon applied: -€${Number(data.coupon.discount).toFixed(2)}`
    );
  } catch (error: any) {
    setCouponMessage(error?.message || t("checkoutClaimedCouponFailed"));
  } finally {
    setCouponLoading(false);
  }
}

  useEffect(() => {
    const claimedCode = localStorage.getItem("claimedCouponCode");

    if (claimedCode) {
      setCouponCode(claimedCode);
      setCouponMessage(t("checkoutClaimedCouponLoaded"));
    }
  }, []);

  useEffect(() => {
    async function loadSavedAddresses() {
      setSavedAddressLoading(true);

      try {
        const response = await fetch("/api/account/addresses", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success && Array.isArray(data.addresses)) {
          setSavedAddresses(data.addresses);

          const defaultAddress =
            data.addresses.find((address: SavedAddress) => address.isDefault) ||
            data.addresses[0];

          if (defaultAddress) {
            setSelectedSavedAddressId(defaultAddress.id);
          }
        }
      } catch {
        setSavedAddresses([]);
      } finally {
        setSavedAddressLoading(false);
      }
    }

    loadSavedAddresses();
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    const claimedCode = localStorage.getItem("claimedCouponCode");

    if (
      claimedCode &&
      deliveryConfirmed &&
      totalPrice > 0 &&
      !appliedCoupon &&
      !couponLoading
    ) {
      applyClaimedCoupon(claimedCode);
    }
  }, [deliveryConfirmed, totalPrice]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cart.length === 0) {
      setStatus(t("checkoutCartEmpty"));
      return;
    }

    if (!deliveryConfirmed || distanceKm <= 0 || !addressLabel) {
      setStatus(t("checkoutConfirmLocationBeforeOrder"));
      setLocationPopupOpen(true);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const customerName = String(formData.get("customerName") || "");
    const customerPhone = String(formData.get("customerPhone") || "");
    const customerEmail = String(formData.get("customerEmail") || "");
    const addressExtra = String(formData.get("addressExtra") || "");
    const customerNote = String(formData.get("customerNote") || "");
    const paymentMethod = String(formData.get("paymentMethod") || "cash");

    setLoading(true);
    setStatus(null);
    setOrderId(null);

    try {
      const response = await fetch("/api/send-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          addressLabel,
          addressExtra,
          customerNote,
          paymentMethod,
          lat,
          lng,
          distanceKm,
          couponCode: appliedCoupon?.code || "",
          cart: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            basePrice: item.basePrice || item.price,
            addonsTotal: Math.max(
              0,
              Number(item.price || 0) -
                Number(item.basePrice || item.price || 0)
            ),
            addons: item.addons || [],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("checkoutOrderProblem"));
      }

      setStatus(t("checkoutOrderSuccess"));
      setOrderId(data.orderId);
      clearCart();
      setAppliedCoupon(null);
      setCouponCode("");
      localStorage.removeItem("claimedCouponCode");
      setDeliveryFee(0);
      setDistanceKm(0);
      setDurationText("");
      setDeliveryConfirmed(false);
      setAddressLabel("");
      form.reset();
    } catch (error: any) {
      setStatus(error?.message || t("checkoutOrderProblem"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <DeliveryLocationModal
  open={locationPopupOpen}
  subtotal={totalPrice}
  onClose={() => setLocationPopupOpen(false)}
  onConfirm={(data) => {
    setAddressLabel(data.addressLabel);
    setLat(data.lat);
    setLng(data.lng);
    setDistanceKm(data.distanceKm);
    setDurationText(data.durationText);
    setDeliveryFee(data.deliveryFee);
    setPromoApplied(data.promoApplied);
    setPromoTitle(data.promoTitle);
    setDeliveryConfirmed(true);
    setAppliedCoupon(null);
    setCouponMessage("");
  }}
/>
      <section className="bg-[#1b0e0a] px-4 py-16 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875] sm:text-xs">
          Ravintola Sinet
        </p>
        <h1 className="mt-4 font-script text-[78px] leading-none sm:text-[110px]">
          {t("checkoutTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
          {t("checkoutSubtitle")}
        </p>
      </section>

      <section className="sinet-container py-10 lg:py-14">
        {!userLoading && !user && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-[#d8c9ac] bg-[#1b0e0a] shadow-2xl shadow-[#3b1f18]/15">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 text-white sm:p-8 lg:p-10">
                <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[#d7b875]">
                  {t("checkoutLoyaltyReward")}
                </p>

                <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">
                  {t("checkoutLoginRewardTitle")}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                  {t("checkoutLoginRewardText")}
                </p>
              </div>

              <div className="border-t border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-sm font-black text-[#3b1f18]">
                    {t("checkoutMonthlyRewardCoupon")}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#7b6255]">
                    {t("checkoutLoginRegisterText")}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <a
                      href={`/login?next=${encodeURIComponent("/checkout")}`}
                      className="rounded-2xl bg-[#3b1f18] px-5 py-3 text-center text-sm font-black text-white"
                    >
                      {t("login")}
                    </a>

                    <a
                      href={`/signup?next=${encodeURIComponent("/checkout")}`}
                      className="rounded-2xl border border-[#3b1f18] px-5 py-3 text-center text-sm font-black text-[#3b1f18]"
                    >
                      {t("register")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <CartSummary />

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/10 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              {t("checkoutDelivery")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-black text-[#3b1f18]">
              {t("checkoutDeliveryLocation")}
            </h2>


          {savedAddresses.length > 0 && (
  <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
    <label className="mb-2 block text-sm font-black text-[#3b1f18]">
      {t("checkoutUseSavedAddress")}
    </label>

    <div className="flex flex-col gap-3 sm:flex-row">
      <select
        value={selectedSavedAddressId}
        onChange={(event) => setSelectedSavedAddressId(event.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-[#d8c9ac] bg-white px-3 py-3 text-sm outline-none"
      >
        {savedAddresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.label}
            {address.isDefault ? " · Default" : ""} —{" "}
            {address.addressLabel}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => useSavedAddress(selectedSavedAddressId)}
        disabled={!selectedSavedAddressId || savedAddressLoading}
        className="rounded-xl bg-[#3b1f18] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {t("use")}
      </button>
    </div>
  </div>
)}

            <div className="mt-5 rounded-2xl bg-[#fffaf3] p-4">
              {deliveryConfirmed ? (
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-[#3b1f18]">{addressLabel}</p>

                  <div className="flex justify-between">
                    <span>Distance</span>
                    <strong>{distanceKm.toFixed(2)} km</strong>
                  </div>

                    {durationText && (
                      <div className="flex justify-between">
                        <span>{t("checkoutEstimatedDeliveryTime")}</span>
                        <strong>{durationText} + {t("checkoutPrepTime")}</strong>
                      </div>
                    )}

                  <div className="flex justify-between">
                    <span>{t("checkoutDeliveryFee")}</span>
                    <strong>€{deliveryFee.toFixed(2)}</strong>
                  </div>

                  {promoApplied && promoTitle && (
                    <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                      {promoTitle}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#7b6255]">
                  {t("checkoutLocationNotConfirmed")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLocationPopupOpen(true)}
              className="mt-4 rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
            >
              {deliveryConfirmed ? t("checkoutChangeLocation") : t("checkoutConfirmLocation")}
            </button>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/10 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              {t("checkoutCoupon")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-black text-[#3b1f18]">
              {t("checkoutApplyCoupon")}
            </h2>

            <div className="mt-5 flex gap-3">
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setAppliedCoupon(null);
                  setCouponMessage("");
                }}
                placeholder={t("checkoutCouponPlaceholder")}
                className="min-w-0 flex-1 rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm font-bold uppercase outline-none focus:border-[#c9a45c]"
              />

              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim() || cart.length === 0}
                className="rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {couponLoading ? t("checking") : t("apply")}
              </button>
            </div>

            {couponMessage && (
              <p
                className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold ${
                  appliedCoupon
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {couponMessage}
              </p>
            )}

            {appliedCoupon && (
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                  localStorage.removeItem("claimedCouponCode");
                  setCouponMessage("");
                }}
                className="mt-3 text-sm font-black text-red-600 underline underline-offset-4"
              >
                {t("checkoutRemoveCoupon")}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/10 sm:p-7">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              {t("checkoutCustomer")}
            </p>
            <h2 className="mt-1 font-display text-3xl font-black text-[#3b1f18]">
              {t("checkoutCustomerDetails")}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input name="customerName" type="text" required placeholder={t("checkoutPhonePlaceholder")} className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]" />
            <input name="customerPhone" type="tel" required placeholder="Phone" className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]" />
            <input name="customerEmail" type="email" required placeholder={t("checkoutEmailPlaceholder")} className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]" />

            <input
              value={addressLabel}
              readOnly
              placeholder={t("checkoutSelectedAddressPlaceholder")}
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#eee2ce] px-4 py-3 text-sm outline-none"
            />

            <input name="addressExtra" type="text" placeholder={t("checkoutAddressExtraPlaceholder")} className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]" />

            <select name="paymentMethod" className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]">
              <option value="cash">{t("checkoutCashOnDelivery")}</option>
              <option value="card">{t("checkoutCardOnDelivery")}</option>
            </select>

            <textarea
  name="customerNote"
  placeholder={t("checkoutOrderNotePlaceholder")}
  className="min-h-24 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
/>

            <div className="rounded-2xl bg-[#fffaf3] p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <strong>€{totalPrice.toFixed(2)}</strong>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>Delivery</span>
                <strong>€{deliveryFee.toFixed(2)}</strong>
              </div>

              {appliedCoupon && (
                <div className="mt-2 flex justify-between text-sm text-green-700">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <strong>-€{couponDiscount.toFixed(2)}</strong>
                </div>
              )}

              <div className="mt-4 flex justify-between border-t border-[#eadfce] pt-4 font-display text-2xl font-black text-[#3b1f18]">
                <span>{t("checkoutTotal")}</span>
                <span>€{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="sinet-gold-button w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
  ? t("checkoutPlacingOrder")
  : `${t("checkoutPlaceOrder")} — €${finalTotal.toFixed(2)}`}
            </button>

            {status && (
              <div
                className={`rounded-2xl px-5 py-4 text-sm font-bold ${
                  orderId
                    ? "border border-green-200 bg-green-50 text-green-800"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <p>{status}</p>
                {orderId && <p className="mt-1">{t("checkoutOrderId")}: {orderId}</p>}
              </div>
            )}
          </form>
        </div>
        </div>
      </section>
    </main>
  );
}