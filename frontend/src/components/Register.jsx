import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import '../styles/Register.css'

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Too Short!").required("Required"),
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="register-container">
      <h2>Register</h2>
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        validationSchema={RegisterSchema}
        onSubmit={async (values, { setSubmitting }) => {
  try {
    const response = await axios.post("http://localhost:5000/api/users/register", values);
    if (response.status === 200 || response.status === 201) {
  alert("Registration successful! Redirecting to login...");
  setTimeout(() => {
    navigate("/login");
  }, 1000);
}

  } catch (error) {
    console.error("Registration failed:", error);
  } finally {
    setSubmitting(false);
  }
}}

      >
        {({ errors, touched }) => (
          <Form>
            <div>
              <label>Username</label>
              <Field name="username" type="text" />
              {errors.username && touched.username && <div>{errors.username}</div>}
            </div>
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
    onClick={() => setShowPassword((prev) => !prev)}
    style={{
      position: "absolute",
      top: "60%",
      right: "10px",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "17px", 
      color: "#333"
    }}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
  {errors.password && touched.password && <div>{errors.password}</div>}
</div>

            <button type="submit">Register</button>
          </Form>
        )}
      </Formik>
      <p>
        Already an existing user? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;
