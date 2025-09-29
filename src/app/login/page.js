"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { postRequest, uploadFile } from "@/service";
import TopSection from "../components/topSection";
import OTPModal from "../components/OTPModal";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [accountType, setAccountType] = useState("Buyer");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandImage, setBrandImage] = useState(null);
  const [companyInfo, setCompanyInfo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP verification state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);

  const isSeller = useMemo(() => accountType === "Seller", [accountType]);

  const inputClass =
    "bg-transparent border border-brand/40 rounded px-3 py-2 placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-brand/40";
  const labelClass = "text-sm";
  const tabClass = (tab) =>
    `w-full px-4 py-2 text-center rounded ${
      activeTab === tab ? "bg-primary !text-white" : "bg-transparent border border-brand/30 text-brand"
    }`;

  function handleBrandImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    setBrandImage(file);
  }

  // OTP verification functions
  async function sendOTP(email) {
    try {
      const response = await fetch("https://equiherds-smtp.vercel.app/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to send OTP");
    }
  }

  async function verifyOTP(email, otp) {
    try {
      const response = await fetch("https://equiherds-smtp.vercel.app/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || "OTP verification failed");
    }
  }

  async function handleOTPVerify(otp) {
    if (!pendingRegistrationData) return;

    setOtpLoading(true);
    try {
      const result = await verifyOTP(pendingRegistrationData.email, otp);
      
      if (result.message === "OTP verified successfully") {
        toast.success("Email verified successfully!");
        // Proceed with account creation
        await createAccount(pendingRegistrationData);
        setShowOTPModal(false);
        setPendingRegistrationData(null);
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error(error.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleOTPResend() {
    if (!pendingRegistrationData) return;

    setOtpLoading(true);
    try {
      await sendOTP(pendingRegistrationData.email);
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function createAccount(registrationData) {
    try {
      const mappedAccountType = registrationData.accountType.toLowerCase();

      let brandImageUrl;
      if (registrationData.isSeller && registrationData.brandImage) {
        if (typeof registrationData.brandImage === 'string') {
          brandImageUrl = registrationData.brandImage;
        } else {
          try {
            brandImageUrl = await uploadFile(registrationData.brandImage);
          } catch (err) {
            toast.error(err?.message || "Image upload failed");
            return;
          }
        }
      }

      const payload = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email,
        accountType: mappedAccountType,
        phoneNumber: registrationData.phoneNumber,
        password: registrationData.password,
        status: "active",
      };

      // Only add optional fields if they have values
      if (registrationData.isSeller && registrationData.companyName) {
        payload.companyName = registrationData.companyName;
      }
      if (registrationData.isSeller && brandImageUrl) {
        payload.brandImage = brandImageUrl;
      }
      if (registrationData.isSeller && registrationData.companyInfo) {
        payload.companyInfo = registrationData.companyInfo;
      }
      const res = await postRequest("/api/users", payload);
      if (res && res.user) {
        toast.success(res.message || "Account created successfully!");
        setActiveTab("login");
        // Reset form
        setFirstName("");
        setLastName("");
        setRegisterEmail("");
        setAccountType("Buyer");
        setPhoneNumber("");
        setCompanyName("");
        setBrandImage(null);
        setCompanyInfo("");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res?.message || "Failed to create account");
      }
    } catch (err) {
      toast.error(err.message || "Failed to create account");
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    try {
      const res = await postRequest("/api/login", {
        email: loginEmail,
        password: loginPassword,
      });
      if (res?.message === "Login successful") {
        if (res?.token) {
          localStorage.setItem("token", res.token);
        }
        toast.success(res?.message || "Logged in successfully");
        window.location.href = "/profile";
      } else {
        toast.error(res?.message || "Login failed");
      }
    } catch (err) {
      toast.error(err?.message || "Login failed");
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Store registration data for later use
    const registrationData = {
      firstName,
      lastName,
      email: registerEmail,
      accountType,
      phoneNumber,
      companyName,
      brandImage,
      companyInfo,
      password,
      isSeller,
    };

    setPendingRegistrationData(registrationData);

    try {
      // Send OTP first
      await sendOTP(registerEmail);
      toast.success("OTP sent to your email. Please check your inbox.");
      setShowOTPModal(true);
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
      setPendingRegistrationData(null);
    }
  }

  return (
    <div className="font-sans">
      <TopSection title={activeTab === "login" ? "Login" : "Register"} />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="hidden lg:flex rounded-xl overflow-hidden border border-white/10">
            <div className="relative flex-1 bg-[url('/slider/2.jpg')] bg-cover bg-center">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 h-full w-full p-8 flex flex-col justify-end gap-4">
                <h3 className="text-2xl font-semibold">Welcome to Equiherds</h3>
                <p className="text-white/80">Join our marketplace to buy or sell with confidence.</p>
                <ul className="text-white/70 list-disc list-inside space-y-1">
                  <li>Secure accounts</li>
                  <li>Trusted sellers</li>
                  <li>24/7 support</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="grid grid-cols-2 gap-2 mb-6 ">
              <button
                type="button"
                className={
                  tabClass("login") +
                  (activeTab === "login" ? " text-white" : "")
                }
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={
                  tabClass("register") +
                  (activeTab === "register" ? " text-white" : "")
                }
                onClick={() => setActiveTab("register")}
              >
                Register
              </button>
            </div>

            {activeTab === "login" ? (
              <form className="grid gap-4 rounded-xl border border-white/10 bg-white text-black p-6" onSubmit={handleLoginSubmit}>
                <div className="grid gap-1">
                  <label className={labelClass} htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <label className={labelClass} htmlFor="login-password">Password</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      className={`${inputClass} pr-16 w-full`}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs underline leading-none"
                      onClick={() => setShowLoginPassword((v) => !v)}
                    >
                      {showLoginPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 select-none">
                    <input type="checkbox" className="accent-white" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  <a href="#" className="underline">Forgot password?</a>
                </div>
                <button type="submit" className="bg-primary !text-white rounded px-4 py-2 font-medium">Login</button>
              </form>
            ) : (
              <form className="grid gap-4 rounded-xl border border-white/10 bg-white text-black p-6" onSubmit={handleRegisterSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="first-name">First name</label>
                    <input
                      id="first-name"
                      className={inputClass}
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="last-name">Last name</label>
                    <input
                      id="last-name"
                      className={inputClass}
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className={labelClass} htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="account-type">Account type</label>
                    <select
                      id="account-type"
                      className={`${inputClass} bg-black/10`}
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                    >
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="phone-number">Phone number</label>
                    <input
                      id="phone-number"
                      type="tel"
                      className={inputClass}
                      placeholder="+1 555 000 1234"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isSeller && (
                  <div className="grid gap-4 p-4 rounded border border-white/10">
                    <div className="grid gap-1">
                      <label className={labelClass} htmlFor="company-name">Company name</label>
                      <input
                        id="company-name"
                        className={inputClass}
                        placeholder="Your Company LLC"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required={isSeller}
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className={labelClass} htmlFor="brand-image">Brand image</label>
                      <input
                        id="brand-image"
                        type="file"
                        accept="image/*"
                        className="file:mr-4 file:rounded file:border-0 file:bg-primary file:text-black file:px-4 file:py-2 file:font-medium hover:file:opacity-90"
                        onChange={handleBrandImageChange}
                      />
                      {brandImage && (
                        <span className="text-xs text-green-700 break-all">{typeof brandImage === 'string' ? brandImage : brandImage.name}</span>
                      )}
                    </div>
                    <div className="grid gap-1">
                      <label className={labelClass} htmlFor="company-info">Company info</label>
                      <textarea
                        id="company-info"
                        className={`${inputClass} min-h-[100px]`}
                        placeholder="Tell buyers about your company..."
                        value={companyInfo}
                        onChange={(e) => setCompanyInfo(e.target.value)}
                        required={isSeller}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="password">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showRegPassword ? "text" : "password"}
                        className={`${inputClass} pr-16 w-full`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs underline leading-none"
                        onClick={() => setShowRegPassword((v) => !v)}
                      >
                        {showRegPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <label className={labelClass} htmlFor="confirm-password">Confirm password</label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showRegConfirm ? "text" : "password"}
                        className={`${inputClass} pr-16 w-full`}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs underline leading-none"
                        onClick={() => setShowRegConfirm((v) => !v)}
                      >
                        {showRegConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="bg-primary !text-white rounded px-4 py-2 font-medium">Create account</button>
        </form>
            )}
          </div>
        </div>
      </section>

      {/* OTP Verification Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingRegistrationData(null);
        }}
        email={pendingRegistrationData?.email || ""}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        isLoading={otpLoading}
      />
    </div>
  );
}


