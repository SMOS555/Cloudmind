import { useState } from "react";

function Topbar({ onLogout, user, setActivePage, awsCredentials, updateAwsCredentials }) {

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);


  // ==========================================
  // TOGGLE SEARCH
  // ==========================================

  const toggleSearch = () => {

    setShowSearch((prev) => !prev);
    setShowNotifications(false);
    setShowProfile(false);

  };


  // ==========================================
  // TOGGLE NOTIFICATIONS
  // ==========================================

  const toggleNotifications = () => {

    setShowNotifications((prev) => !prev);
    setShowSearch(false);
    setShowProfile(false);

  };


  // ==========================================
  // TOGGLE PROFILE
  // ==========================================

  const toggleProfile = () => {

    setShowProfile((prev) => !prev);
    setShowSearch(false);
    setShowNotifications(false);

  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {

    setShowProfile(false);

    if (onLogout) {
      await onLogout();
    }

  };


  // ==========================================
  // USER DETAILS
  // ==========================================

  const email = user?.email || "User";

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";


  return (

    <header className="topbar">

      {/* ======================================
          BREADCRUMB & AWS INDICATOR
      ====================================== */}

      <div className="breadcrumb">

        <span>
          CloudMind
        </span>

        <span>
          /
        </span>

        <strong>
          Overview
        </strong>

      </div>

      <div
        className="topbar-aws-badge"
        onClick={() => setActivePage && setActivePage("dashboard")}
        title="AWS credentials active across all pages. Click to manage on Dashboard."
        style={{ cursor: "pointer" }}
      >
        <span
          className={`aws-status-indicator ${
            awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults
              ? "active"
              : "default"
          }`}
        ></span>
        <span className="topbar-aws-text">
          AWS: {awsCredentials?.region || "ap-south-1"}
          {awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults ? " (Custom)" : " (Server)"}
        </span>
      </div>


      {/* ======================================
          TOPBAR ACTIONS
      ====================================== */}

      <div className="topbar-actions">


        {/* ====================================
            SEARCH
        ==================================== */}

        <div className="topbar-dropdown-wrapper">

          <button
            className="icon-button"
            onClick={toggleSearch}
            title="Search"
          >
            ⌕
          </button>


          {showSearch && (

            <div className="topbar-dropdown search-dropdown">

              <input
                type="text"
                placeholder="Search CloudMind..."
                autoFocus
              />

              <div className="search-hint">
                Search resources, providers, analytics...
              </div>

            </div>

          )}

        </div>


        {/* ====================================
            NOTIFICATIONS
        ==================================== */}

        <div className="topbar-dropdown-wrapper">

          <button
            className="icon-button notification"
            onClick={toggleNotifications}
            title="Notifications"
          >

            ♢

            <span></span>

          </button>


          {showNotifications && (

            <div className="topbar-dropdown notification-dropdown">

              <div className="dropdown-header">

                <strong>
                  Notifications
                </strong>

                <span>
                  3 new
                </span>

              </div>


              <div className="notification-item">

                <div className="notification-icon warning">
                  !
                </div>

                <div>

                  <strong>
                    CPU spike detected
                  </strong>

                  <p>
                    VM-03 exceeded 80% utilization.
                  </p>

                  <small>
                    8 min ago
                  </small>

                </div>

              </div>


              <div className="notification-item">

                <div className="notification-icon saving">
                  ₹
                </div>

                <div>

                  <strong>
                    Potential savings found
                  </strong>

                  <p>
                    ₹4,200/month could be saved.
                  </p>

                  <small>
                    23 min ago
                  </small>

                </div>

              </div>


              <div className="notification-item">

                <div className="notification-icon security">
                  ✓
                </div>

                <div>

                  <strong>
                    Security improved
                  </strong>

                  <p>
                    2 configuration issues resolved.
                  </p>

                  <small>
                    1 hr ago
                  </small>

                </div>

              </div>


              <button className="dropdown-footer">

                View all notifications →

              </button>

            </div>

          )}

        </div>


        {/* ====================================
            USER PROFILE
        ==================================== */}

        <div className="topbar-dropdown-wrapper profile-wrapper">


          <button
            className="user-profile"
            onClick={toggleProfile}
          >

            <div className="avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>


            <div className="user-info">

              <strong>
                {displayName}
              </strong>

              <span>
                Administrator
              </span>

            </div>


            <span
              className={`chevron ${
                showProfile ? "chevron-open" : ""
              }`}
            >
              ▾
            </span>

          </button>


          {/* ==================================
              PROFILE DROPDOWN
          ================================== */}

          {showProfile && (

            <div className="topbar-dropdown profile-dropdown">


              {/* PROFILE HEADER */}

              <div className="profile-header">

                <div className="avatar large">
                  {displayName.charAt(0).toUpperCase()}
                </div>


                <div className="profile-user-details">

                  <strong>
                    {displayName}
                  </strong>

                  <span>
                    {email}
                  </span>

                </div>

              </div>


              {/* DIVIDER */}

              <div className="dropdown-divider"></div>


              {/* PROFILE */}

              <button
                className="profile-menu-item"
                type="button"
              >

                <span className="menu-icon">
                  👤
                </span>

                <span>
                  Profile
                </span>

              </button>


              {/* SETTINGS */}

              <button
                className="profile-menu-item"
                type="button"
              >

                <span className="menu-icon">
                  ⚙
                </span>

                <span>
                  Settings
                </span>

              </button>


              {/* ACCOUNT */}

              <button
                className="profile-menu-item"
                type="button"
              >

                <span className="menu-icon">
                  ◉
                </span>

                <span>
                  Account
                </span>

              </button>


              {/* DIVIDER */}

              <div className="dropdown-divider"></div>


              {/* LOGOUT */}

              <button
                className="profile-menu-item logout"
                type="button"
                onClick={handleLogout}
              >

                <span className="menu-icon">
                  ↪
                </span>

                <span>
                  Sign out
                </span>

              </button>


            </div>

          )}

        </div>

      </div>

    </header>

  );

}

export default Topbar;