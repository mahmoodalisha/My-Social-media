import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Register.css"; 

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Too Short!").required("Required"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSendOtp = async (email) => {
  if (cooldown) return;

  setCooldown(true);
  setErrorMessage("");
  setSuccessMessage("");

  try {
    const response = await axios.post("http://localhost:5000/api/users/request-otp", { email });
    setSuccessMessage(response.data.message);  
    setOtpSent(true);
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      setErrorMessage(error.response.data.message); 
    } else {
      setErrorMessage("Failed to send OTP. Try again.");
    }
    console.error("OTP send failed:", error);
  }

  setTimeout(() => setCooldown(false), 120000);
};



  const handleVerifyOtpAndLogin = async (values) => {
  try {
    const fullOtp = verificationCode.join(""); 

    const otpResponse = await axios.post("http://localhost:5000/api/users/verify-otp", {
      email: values.email,
      otp: fullOtp,
    });

    if (otpResponse.status === 200) {
      const loginResponse = await axios.post("http://localhost:5000/api/users/login", values);

      if (loginResponse.status === 200) {
        const userData = loginResponse.data;
        login(userData);
        dispatch(setUser(userData));
        navigate("/home");
      }
    }
  } catch (error) {
    console.error("Login or OTP verification failed:", error);
    setErrorMessage("OTP verification or login failed.");
  }
};


  return (
    <div className="register-container">
      <h2>Login</h2>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={(values) => {
          setErrorMessage("");
          setSuccessMessage("");
          handleVerifyOtpAndLogin(values);
        }}
      >
        {({ values, errors, touched }) => (
          <Form>
            <div>
              <label>Email</label>
              <Field name="email" type="email" />
              {errors.email && touched.email && <div>{errors.email}</div>}
            </div>

            <div style={{ position: "relative" }}>
  <label>Password</label>
  <Field
    name="password"
    type={showPassword ? "text" : "password"}
    style={{ paddingRight: "30px" }}
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "60%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "17px", 
      color: "#333"
    }}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
  {errors.password && touched.password && (
    <div>{errors.password}</div>
  )}
</div>


            {!otpSent ? (
              <button
  type="button"
  onClick={() => handleSendOtp(values.email)}
  disabled={cooldown}
  className={cooldown ? "otp-button disabled" : "otp-button"}
>
  {cooldown ? "Wait..." : "Send OTP"}
</button>

            ) : (
              <>
                <div>
  <label>Enter OTP</label>
  <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
    {verificationCode.map((digit, index) => (
      <input
        key={index}
        id={`otp-input-${index}`}
        type="text"
        value={digit}
        maxLength={1}
        onChange={(e) => {
          const val = e.target.value;
          if (/^[0-9]?$/.test(val)) {
            const newCode = [...verificationCode];
            newCode[index] = val;
            setVerificationCode(newCode);

            
            if (val !== "" && index < 5) {
              document.getElementById(`otp-input-${index + 1}`).focus();
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
            document.getElementById(`otp-input-${index - 1}`).focus();
          }
        }}
        style={{
          width: "25px",
          height: "25px",
          textAlign: "center",
          fontSize: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          outline: "none",
        }}
      />
    ))}
  </div>
</div>

                <button type="submit">Login</button>
              </>
            )}

            {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
            {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}
          </Form>
        )}
      </Formik>

      <p>
        Forgot your password? <a href="/forgot-password">Reset here</a>
      </p>
      <p>
        New user? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;