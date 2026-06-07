
"use client";
import React, { useState } from "react";
import Head from "next/head";
import Footer from "../../components/ui/footer";

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    walletAddress: "",
    category: "",
    description: "",
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <Head>
        <title>Contact Erebrus</title>
        <meta
          name="description"
          content="Get in touch with the Erebrus team for support or inquiries."
        />
        <link rel="canonical" href="https://erebrus.io/contact" />
      </Head>
      <div className="min-h-screen bg-black text-white mt-12">
        <div className="container mx-auto px-4 py-16 ">
          <h1 className="text-3xl text-center mb-12">
            Support Request Form
          </h1>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto font-sans space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-lg mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-lg mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-lg mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="walletAddress" className="block text-lg mb-2">
                Wallet Address (Optional)
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-lg mb-2">
                Query Category
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              >
                <option value="">Select a category</option>
                <option value="profile">Profile</option>
                <option value="login">Login</option>
                <option value="payment">Payment</option>
                <option value="account-deletion">Account Deletion</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-lg mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Please provide detailed information about your query."
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-[#0162FF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0162FF] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#0152cc] transition-colors"
              aria-label="Submit support request form"
            >
              Submit
            </button>
          </form>
        </div>

        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-4">Request Submitted</h2>
                <p className="text-gray-300 mb-6">
                  Your request has been received. We will review it and provide
                  further updates via email.
                </p>
                <button
                  onClick={() => setShowPopup(false)}
                  className="bg-[#0162FF] text-white px-6 py-2 rounded-lg hover:bg-[#0152cc] transition-colors "
                  aria-label="Close confirmation popup"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default Contact;
