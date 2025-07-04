import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import './App.css';
import SuccessPage from './components/SuccessPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ManageRegistrations from './components/ManageRegistrations';
import Evaluation from './components/Evaluation';

function Header({ isSidebarOpen, toggleSidebar, handleOverlayClick }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true); // State to control header visibility
  const [lastScrollY, setLastScrollY] = useState(0); // State to track last scroll position

  useEffect(() => {
    // This effect ensures the button state updates if the token changes outside of direct logout
    const checkAdminStatus = () => {
      // setIsAdminLoggedIn(!!localStorage.getItem('adminToken')); // No longer needed as isAdminLoggedIn is removed
    };
    window.addEventListener('storage', checkAdminStatus);

    // Handle scroll to show/hide header
    const handleScroll = () => {
      if (window.scrollY < lastScrollY) { // Scrolling up
        setIsVisible(true);
      } else if (window.scrollY > lastScrollY && window.scrollY > 100) { // Scrolling down past a threshold
        setIsVisible(false);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', checkAdminStatus);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]); // Re-run effect when lastScrollY changes

  // handleLogout is removed as it's not used in the current Header UI
  /*
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    // setIsAdminLoggedIn(false); // Update state to reflect logout
    navigate('/');
  };
  */

  return (
    <header className={`header ${isVisible ? '' : 'header-hidden'}`}>
      <div className="logo-container">
        <Link to="/">
          <img src="/academic-affairs-logo.png" alt="Department of Academic Affairs Logo" className="logo" />
        </Link>
      </div>
      <div className="admin-section">
        {/* Admin Login/Logout removed as per request */}
      </div>
      {/* Mobile Navigation Toggle (Hamburger Menu) */}
      <button
        className="mobile-nav-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
    </header>
  );
}

function RegistrationForm({ isSidebarOpen, setIsSidebarOpen, handleOverlayClick }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Section 1: Student Details
    fullName: '',
    uid: '',
    cluster: '',
    institute: '',
    department: '',
    phoneNumber: '+91',
    email: '',

    // Section 2: Experience
    leadershipRoles: '',
    yourPosition: '',
    otherPositionName: '',
    nameOfEntity: '',
    isServingLeadPosition: '',
    sop: null,
    resume: null,
    linkedinAccount: '',

    // Section 3: Recommendation
    recommendationLetter: null,

    // Section 4: Terms & Conditions
    terms: [false, false, false, false]
  });

  const clusters = [
    'Engineering and Technology',
    'Liberal Arts and Humanities',
    'Management',
    'Health and Applied Science',
    'Basic and Applied Science'
  ];

  const institutes = [
    'University Institute of Engineering (UIE)',
    'Academic Unit',
    'University Institute of Computing (UIC)',
    'Apex Institute of Technology(AIT)',
    'University Institute of Teachers Training and Research (UITTR)',
    'University Institute of Design (UID)',
    'University Institute of Liberal Arts and Humanities  (UILH)',
    'University Institute of Architecture (UIA)',
    'University Institute of Film and Visual Arts (UIFVA)',
    'University Institute of Media Studies (UIMS)',
    'University Institute of Tourism & Hospitality Management (UITHM)',
    'University Institute of Legal Studies (UILS)',
    'University School of Business (USB)',
    'University Institute of Pharmaceutical Sciences (UIPS)',
    'University Institute of Applied Health Sciences (UIAHS)',
    'University Institute of Sciences (UIS)',
    'University Institute of Bio-Technology (UIBT)',
    'University Institute of Agricultural Sciences (UIAS)'
  ];

  const [activeSection, setActiveSection] = useState('student-details');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(''); // This state is used before navigation to /success, keeping for now
  const [showOtherPositionField, setShowOtherPositionField] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sectionErrors, setSectionErrors] = useState({}); // This state is set on errors, will be used for displaying a general section error
  const [showValidationErrors, setShowValidationErrors] = useState(false); // New state to control error visibility

  // Clear errors when activeSection changes
  useEffect(() => {
    // console.log(`[useEffect] activeSection changed to: ${activeSection}`); // Removed unnecessary console.log
    setSectionErrors({});
    // Explicitly set all field errors to false when section changes
    const newFieldErrors = {};
    for (const key in formData) {
      newFieldErrors[key] = false;
    }
    setFieldErrors(newFieldErrors);
    setShowValidationErrors(false); // Hide validation errors on section change
    // console.log('[useEffect] fieldErrors reset to:', newFieldErrors); // Removed unnecessary console.log
  }, [activeSection]); // Removed formData from dependency array to prevent unnecessary re-runs

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Clear error for the current field as user starts typing
    setFieldErrors(prev => {
      // console.log(`[handleInputChange] Clearing error for ${name}. Previous errors:`, prev); // Removed unnecessary console.log
      return { ...prev, [name]: false };
    });
    if (name === 'phoneNumber') {
      // Ensure it always starts with +91 and only allows digits after
      if (!value.startsWith('+91')) {
        setFormData(prev => ({
          ...prev,
          phoneNumber: '+91'
        }));
        return;
      }
      const numericValue = value.substring(3).replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({
          ...prev,
          phoneNumber: '+91' + numericValue
        }));
      }
    } else if (name === 'yourPosition') {
      setShowOtherPositionField(value === 'Other Leadership Position');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        otherPositionName: value === 'Other Leadership Position' ? prev.otherPositionName : '' // Clear if not 'Other'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value || '' // Ensure value is never undefined
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      try {
        validateFileSize(files[0]);
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }));
        // Clear error for the current field
        setFieldErrors(prev => ({ ...prev, [name]: false }));
      } catch (error) {
        setFieldErrors(prev => ({ ...prev, [name]: true }));
        setSectionErrors(prev => ({ ...prev, [activeSection]: error.message }));
      }
    }
  };

  const handleTermsChange = (index) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.map((term, i) => i === index ? !term : term)
    }));
  };

  const validateCurrentSection = () => {
    let errors = {};
    let isValid = true;

    switch (activeSection) {
      case 'student-details':
        if (!formData.fullName) { errors.fullName = true; isValid = false; }
        if (!formData.uid) { errors.uid = true; isValid = false; }
        if (!formData.cluster) { errors.cluster = true; isValid = false; }
        if (!formData.institute) { errors.institute = true; isValid = false; }
        if (!formData.department) { errors.department = true; isValid = false; }
        if (!formData.phoneNumber || !/[0-9]{10}$/.test(formData.phoneNumber.substring(3))) { 
          errors.phoneNumber = true; 
          isValid = false; 
        }
        if (!formData.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) { 
          errors.email = true; 
          isValid = false; 
        }
        break;
      case 'experience':
        if (!formData.leadershipRoles) { errors.leadershipRoles = true; isValid = false; }
        if (!formData.yourPosition) { errors.yourPosition = true; isValid = false; }
        if (showOtherPositionField && !formData.otherPositionName) { errors.otherPositionName = true; isValid = false; }
        if (!formData.nameOfEntity) { errors.nameOfEntity = true; isValid = false; }
        if (!formData.isServingLeadPosition) { errors.isServingLeadPosition = true; isValid = false; }
        if (!formData.sop) { errors.sop = true; isValid = false; }
        if (!formData.resume) { errors.resume = true; isValid = false; }
        if (!formData.linkedinAccount || !/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(formData.linkedinAccount)) { 
          errors.linkedinAccount = true; 
          isValid = false; 
        }
        break;
      case 'recommendation':
        if (!formData.recommendationLetter) { errors.recommendationLetter = true; isValid = false; }
        break;
      case 'terms':
        if (formData.terms.some(term => !term)) {
          formData.terms.forEach((term, index) => {
            if (!term) errors[`terms-${index}`] = true;
          });
          isValid = false;
        }
        break;
      default:
        isValid = true;
    }
    return { isValid, errors };
  };

  const handleNext = () => {
    // console.log(`[handleNext] Attempting to go to next section from: ${activeSection}`); // Removed unnecessary console.log
    const { isValid, errors } = validateCurrentSection();

    if (isValid) {
      // console.log(`[handleNext] Current section (${activeSection}) is valid. Navigating.`); // Removed unnecessary console.log
      const sections = ['student-details', 'experience', 'recommendation', 'terms'];
      const currentIndex = sections.indexOf(activeSection);
      if (currentIndex < sections.length - 1) {
        setActiveSection(sections[currentIndex + 1]);
        setSectionErrors({});
        setFieldErrors({}); // Clear all field errors on successful navigation
        setShowValidationErrors(false); // Hide errors after successful navigation
        // console.log('[handleNext] fieldErrors cleared after successful navigation.'); // Removed unnecessary console.log
      }
    } else {
      // console.log(`[handleNext] Current section (${activeSection}) is invalid. Setting errors:`, errors); // Removed unnecessary console.log
      setFieldErrors(errors); // Set specific field errors
      setSectionErrors(prev => ({ ...prev, [activeSection]: 'Please fill in all required fields.' }));
      setShowValidationErrors(true); // Show validation errors if current section is invalid
    }
  };

  const handlePrevious = () => {
    // console.log(`[handlePrevious] Attempting to go to previous section from: ${activeSection}`); // Removed unnecessary console.log
    const sections = ['student-details', 'experience', 'recommendation', 'terms'];
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
      setSectionErrors({});
      setFieldErrors({}); // Clear field errors when navigating back
      // console.log('[handlePrevious] fieldErrors cleared after navigating back.'); // Removed unnecessary console.log
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  const validateFileSize = (file) => {
    if (file && file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
    }
  };

  const submitForm = async (formData) => {
    const maxRetries = 3;
    let retryCount = 0;

    // Ensure API_BASE_URL does not have a trailing slash
    const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://central-team-reg-backend.onrender.com').replace(/\/+$/, '');

    const attemptSubmit = async () => {
      try {
        // console.log('Starting form submission...'); // Removed unnecessary console.log

        // No client-side compression for PDFs/Word docs; files will be sent as is.
        // If file size is a persistent issue, consider server-side compression or dedicated client-side libraries for these formats.

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        const response = await fetch(`${API_BASE_URL}/api/registration`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=30'
          },
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'omit',
          keepalive: true,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        // console.log('Submission successful:', result); // Removed unnecessary console.log
        setSuccess('Registration submitted successfully!');
        setSectionErrors({});
        navigate('/success');

      } catch (err) {
        console.error('Submission error:', err);
        
        // Handle network errors and retry with exponential backoff
        if ((err.name === 'TypeError' && err.message.includes('NetworkError')) || 
            err.name === 'AbortError') {
          if (retryCount < maxRetries) {
            retryCount++;
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
            // console.log(`Retrying submission (attempt ${retryCount} of ${maxRetries}) after ${backoffTime}ms...`); // Removed unnecessary console.log
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return attemptSubmit();
          }
        }

        let errorMessage = 'Failed to submit registration. ';
        
        if (err.name === 'AbortError') {
          errorMessage += 'Request timed out. Please try again.';
        } else if (err.message.includes('File too large')) {
          errorMessage += 'One or more files are too large. Maximum size is 10MB per file.';
        } else if (err.message.includes('Invalid file type')) {
          errorMessage += 'One or more files are not in the correct format. Only PDF and Word documents are allowed.';
        } else if (err.message.includes('Server error')) {
          errorMessage += 'Server error occurred. Please try again later. If the problem persists, please contact support.';
        } else if (err.message.includes('ERR_HTTP2_PROTOCOL_ERROR')) {
          errorMessage += 'Connection error. Please try again. If the problem persists, please try using a different browser.';
        } else if (err.name === 'TypeError' && err.message.includes('NetworkError')) {
          errorMessage += 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('valid email address')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (err.message.includes('valid LinkedIn profile URL')) {
          errorMessage = 'Please enter a valid LinkedIn profile URL.';
        } else {
          errorMessage += err.message || 'Please try again.';
        }
        
        setSectionErrors(prev => ({ ...prev, [activeSection]: errorMessage }));
        setSuccess('');
        throw err; // Re-throw to be caught by the outer try-catch for finally block
      }
    };

    try {
      await attemptSubmit();
    } catch (err) {
      // Catch re-thrown errors from attemptSubmit and handle the final loading state here
      console.error('Final submission attempt failed or aborted:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(`[handleSubmit] Attempting to submit from: ${activeSection}`); // Removed unnecessary console.log
    setLoading(true);
    setSectionErrors({});
    setSuccess('');
    setFieldErrors({}); // Clear field errors at the start of submission attempt
    setShowValidationErrors(true); // Always show errors on submission attempt
    // console.log('[handleSubmit] fieldErrors cleared at start of submission.'); // Removed unnecessary console.log

    const { isValid, errors } = validateCurrentSection();

    if (isValid) {
      // console.log(`[handleSubmit] Current section (${activeSection}) is valid. Submitting.`); // Removed unnecessary console.log
      const submitFormData = new FormData();
      
      // Add all form fields
      for (const key in formData) {
        if (formData[key] instanceof File) {
          submitFormData.append(key, formData[key]);
        } else if (key === 'terms') {
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          submitFormData.append(key, formData[key]);
        }
      }

      await submitForm(submitFormData);
    } else {
      // console.log(`[handleSubmit] Current section (${activeSection}) is invalid. Setting errors:`, errors); // Removed unnecessary console.log
      setFieldErrors(errors); // Set specific field errors
      setSectionErrors(prev => ({ ...prev, [activeSection]: 'Please fill in all required fields.' }));
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'student-details':
        return (
          <div className="form-section">
            <h2>Application for Club Core Committee</h2>
            <h3>Student Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['fullName'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="uid">UID <span className="required">*</span></label>
                <input
                  type="text"
                  id="uid"
                  name="uid"
                  value={formData.uid}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['uid'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="cluster">Cluster <span className="required">*</span></label>
                <select
                  id="cluster"
                  name="cluster"
                  value={formData.cluster}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['cluster'] ? 'input-error' : ''}`}
                >
                  <option value="">Select Cluster</option>
                  {clusters.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="institute">Institute <span className="required">*</span></label>
                <select
                  id="institute"
                  name="institute"
                  value={formData.institute}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['institute'] ? 'input-error' : ''}`}
                >
                  <option value="">Select Institute</option>
                  {institutes.map((inst, i) => <option key={i} value={inst}>{inst}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="department">Department <span className="required">*</span></label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['department'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91XXXXXXXXXX"
                  pattern="\+91[0-9]{10}"
                  title="Phone number must be exactly 10 digits long and start with +91."
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['phoneNumber'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['email'] ? 'input-error' : ''}`}
                />
                {showValidationErrors && fieldErrors['email'] && (
                  <small className="error-text">Please enter a valid email address</small>
                )}
              </div>
            </div>
            <div className="form-navigation">
              <button type="button" onClick={handleNext} className="nav-button">Next</button>
            </div>
          </div>
        );
      case 'experience':
        return (
          <div className="form-section">
            <h2>Experience</h2>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="leadershipRoles">Describe your leadership roles and responsibilities in past events/organizations. <span className="required">*</span></label>
                <textarea
                  id="leadershipRoles"
                  name="leadershipRoles"
                  value={formData.leadershipRoles}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`leadership-roles-textarea ${showValidationErrors && fieldErrors['leadershipRoles'] ? 'input-error' : ''}`}
                ></textarea>
              </div>
              <div className="input-group">
                <label htmlFor="yourPosition">Your Position in entity ( entity - club department society community professional society ) <span className="required">*</span></label>
                <select
                  id="yourPosition"
                  name="yourPosition"
                  value={formData.yourPosition}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['yourPosition'] ? 'input-error' : ''}`}
                >
                  <option value="">Select Position</option>
                  <option value="President">President</option>
                  <option value="Vice-President">Vice-President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Joint Secretary">Joint Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Other Leadership Position">Other Leadership Position</option>
                </select>
              </div>
              {showOtherPositionField && (
                <div className="input-group">
                  <label htmlFor="otherPositionName">Specify Other Position <span className="required">*</span></label>
                  <input
                    type="text"
                    id="otherPositionName"
                    name="otherPositionName"
                    value={formData.otherPositionName}
                    onChange={handleInputChange}
                    autoComplete="off"
                    onInvalid={(e) => e.preventDefault()}
                    formNoValidate
                    className={`${showValidationErrors && fieldErrors['otherPositionName'] ? 'input-error' : ''}`}
                  />
                </div>
              )}
              <div className="input-group">
                <label htmlFor="nameOfEntity">Name of the Entity <span className="required">*</span></label>
                <input
                  type="text"
                  id="nameOfEntity"
                  name="nameOfEntity"
                  value={formData.nameOfEntity}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['nameOfEntity'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label>Are you already serving as lead position in any entity? <span className="required">*</span></label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="isServingLeadPosition"
                      value="true"
                      checked={formData.isServingLeadPosition === 'true'}
                      onChange={handleInputChange}
                    />
                    <span></span> Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="isServingLeadPosition"
                      value="false"
                      checked={formData.isServingLeadPosition === 'false'}
                      onChange={handleInputChange}
                    />
                    <span></span> No
                  </label>
                </div>
              </div>
              <div className="input-group full-width">
                <label htmlFor="sop">Statement of Purpose (SOP) <span className="required">*</span></label>
                <small>Max 10MB, PDF only</small>
                <input
                  type="file"
                  id="sop"
                  name="sop"
                  onChange={handleFileChange}
                  accept=".pdf"
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['sop'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="resume">Upload Resume <span className="required">*</span></label>
                <small>Max 10MB, PDF only</small>
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf"
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  className={`${showValidationErrors && fieldErrors['resume'] ? 'input-error' : ''}`}
                />
              </div>
              <div className="input-group">
                <label htmlFor="linkedinAccount">LinkedIn Profile URL <span className="required">*</span></label>
                <input
                  type="url"
                  id="linkedinAccount"
                  name="linkedinAccount"
                  value={formData.linkedinAccount}
                  onChange={handleInputChange}
                  autoComplete="off"
                  onInvalid={(e) => e.preventDefault()}
                  formNoValidate
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  className={`${showValidationErrors && fieldErrors['linkedinAccount'] ? 'input-error' : ''}`}
                />
                {showValidationErrors && fieldErrors['linkedinAccount'] && (
                  <small className="error-text">Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)</small>
                )}
              </div>
            </div>
            <div className="form-navigation">
              <button type="button" onClick={handlePrevious} className="nav-button">Previous</button>
              <button type="button" onClick={handleNext} className="nav-button">Next</button>
            </div>
          </div>
        );
      case 'recommendation':
        return (
          <div className="form-section">
            <h2>Recommendation</h2>
            <div className="input-group full-width">
              <label htmlFor="recommendationLetter">Upload Recommendation Letter <span className="required">*</span></label>
              <small>Max 10MB, PDF only</small>
                <input
                  type="file"
                id="recommendationLetter"
                  name="recommendationLetter"
                  onChange={handleFileChange}
                accept=".pdf"
                autoComplete="off"
                onInvalid={(e) => e.preventDefault()}
                formNoValidate
                className={`${showValidationErrors && fieldErrors['recommendationLetter'] ? 'input-error' : ''}`}
                />
              </div>
            <div className="form-navigation">
              <button type="button" onClick={handlePrevious} className="nav-button">Previous</button>
              <button type="button" onClick={handleNext} className="nav-button">Next</button>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="form-section">
            <h2>Terms & Conditions</h2>
            <div className="terms-section">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="terms-item">
                <input
                  type="checkbox"
                    id={`term-${index}`}
                    checked={formData.terms[index]}
                    onChange={() => handleTermsChange(index)}
                    className={`${showValidationErrors && fieldErrors[`terms-${index}`] ? 'input-error' : ''}`}
                  />
                  <label htmlFor={`term-${index}`}>
                    {index === 0 && 'I agree to abide by the rules and regulations of Chandigarh University and the club.'}
                    {index === 1 && 'I certify that all the information provided is accurate and true to the best of my knowledge.'}
                    {index === 2 && 'I understand that submitting false information may lead to the cancellation of my registration.'}
                    {index === 3 && 'I grant permission for my resume and other submitted details to be reviewed for the purpose of club registration.'}
                    <span className="required">*</span>
              </label>
            </div>
              ))}
            </div>
            <div className="form-navigation">
              <button type="button" onClick={handlePrevious} className="nav-button">Previous</button>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
      onInvalid={(e) => {
        e.preventDefault();
      }}
      noValidate
      autoComplete="off"
    >
          <div className="form-layout">
        <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
              <button
            className="sidebar-item"
            onClick={() => {
              setActiveSection('student-details');
              setIsSidebarOpen(false);
              setSectionErrors({});
            }}
              >
                Student Details
              </button>
              <button
            className="sidebar-item"
            onClick={() => {
              setActiveSection('experience');
              setIsSidebarOpen(false);
              setSectionErrors({});
            }}
              >
                Experience
              </button>
              <button
            className="sidebar-item"
            onClick={() => {
              setActiveSection('recommendation');
              setIsSidebarOpen(false);
              setSectionErrors({});
            }}
              >
                Recommendation
              </button>
              <button
            className="sidebar-item"
            onClick={() => {
              setActiveSection('terms');
              setIsSidebarOpen(false);
              setSectionErrors({});
            }}
              >
                Terms & Conditions
              </button>
            </div>

            <div className="form-content">
              {renderSection()}
            </div>
          </div>
        </form>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <div className="app">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleOverlayClick={handleOverlayClick} />
      <Routes>
          <Route path="/" element={<RegistrationForm isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} handleOverlayClick={handleOverlayClick} />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-registrations" element={<ManageRegistrations />} />
        <Route path="/admin/evaluate" element={<Evaluation />} />
        <Route path="/admin/evaluate/:id" element={<Evaluation />} />
      </Routes>
        <footer className="footer">© 2023 Chandigarh University. All rights reserved.</footer>

        {/* Sidebar Overlay - RENDERED HERE AT APP LEVEL */}
        {isSidebarOpen && (
          <div
            className="sidebar-overlay active"
            onClick={handleOverlayClick}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
