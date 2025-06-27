import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      setError("Please enter your name");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email");
      return false;
    }

    if (!formData.password) {
      setError("Please enter a password");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);
      await signup(formData.email, formData.password, formData.displayName);
      setSuccess("Account created! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Signup error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please choose a stronger password");
          break;
        default:
          setError("Failed to create account. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal">
      <div className="w-full max-w-sm">
        <div className="card">
          <div className="flex flex-col items-center mb-8">
            <h2 className="card-title">Sign up</h2>
            <p className="card-subtitle">
              or{" "}
              <Link
                to="/login"
                className="underline text-peach hover:text-sage transition-colors"
              >
                sign in
              </Link>
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red text-sm mb-2 text-center">{error}</div>
            )}
            {success && (
              <div className="text-sage text-sm mb-2 text-center">
                {success}
              </div>
            )}
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              value={formData.displayName}
              onChange={handleChange}
              className="input mb-4"
              placeholder="Full name"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input mb-4"
              placeholder="Email address"
            />
            <div className="relative mb-4">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input pr-12"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-peach"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="relative mb-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input pr-12"
                placeholder="Confirm password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-peach"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="animate-spin inline-block h-4 w-4 border-b-2 border-sage mr-2 align-middle"></span>
              ) : null}
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
