import { useState } from "react";

function Topbar() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setShowNotifications(false);
    setShowProfile(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSearch(false);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowSearch(false);
    setShowNotifications(false);
  };

  return (
    <header className="topbar">

      {/* BREADCRUMB */}

      <div className="breadcrumb">
        <span>CloudMind</span>
        <span>/</span>
        <strong>Overview</strong>
      </div>


      {/* TOPBAR ACTIONS */}

      <div className="topbar-actions">

        {/* SEARCH */}

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


        {/* NOTIFICATIONS */}

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
                <strong>Notifications</strong>
                <span>3 new</span>
              </div>

              <div className="notification-item">

                <div className="notification-icon warning">
                  !
                </div>

                <div>
                  <strong>CPU spike detected</strong>
                  <p>VM-03 exceeded 80% utilization.</p>
                  <small>8 min ago</small>
                </div>

              </div>


              <div className="notification-item">

                <div className="notification-icon saving">
                  ₹
                </div>

                <div>
                  <strong>Potential savings found</strong>
                  <p>₹4,200/month could be saved.</p>
                  <small>23 min ago</small>
                </div>

              </div>


              <div className="notification-item">

                <div className="notification-icon security">
                  ✓
                </div>

                <div>
                  <strong>Security improved</strong>
                  <p>2 configuration issues resolved.</p>
                  <small>1 hr ago</small>
                </div>

              </div>


              <button className="dropdown-footer">
                View all notifications →
              </button>

            </div>
          )}

        </div>


        {/* USER PROFILE */}

        <div className="topbar-dropdown-wrapper">

          <button
            className="user-profile"
            onClick={toggleProfile}
          >

            <div className="avatar">
              U
            </div>

            <div className="user-info">
              <strong>User</strong>
              <span>Administrator</span>
            </div>

            <span className="chevron">
              ▾
            </span>

          </button>


          {showProfile && (
            <div className="topbar-dropdown profile-dropdown">

              <div className="profile-header">

                <div className="avatar large">
                  U
                </div>

                <div>
                  <strong>User</strong>
                  <span>Administrator</span>
                </div>

              </div>


              <button className="profile-menu-item">
                👤 Profile
              </button>

              <button className="profile-menu-item">
                ⚙ Settings
              </button>

              <button className="profile-menu-item">
                ◉ Account
              </button>

              <div className="dropdown-divider"></div>

              <button className="profile-menu-item logout">
                ↪ Sign out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Topbar;