document.addEventListener("DOMContentLoaded", function () {
    const newReportBtn = document.getElementById("newReportBtn");
    const viewReportsBtn = document.getElementById("viewReportsBtn");
    const reportFormSection = document.getElementById("reportFormSection");
    const reportsSection = document.getElementById("reportsSection");
    const pageTitle = document.getElementById("pageTitle");
    const createFirstReportBtn = document.getElementById("createFirstReportBtn");
    const reportsContainer = document.getElementById("reportsContainer");
    const emptyState = document.getElementById("emptyState");
    const reportForm = document.querySelector(".report-form form");
  
    // Function to check if reports exist and toggle empty state
    function checkReports() {
      const reports = JSON.parse(localStorage.getItem("issueReports")) || [];
      if (reports.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        displayReports(reports);
      }
    }
  
    // Show Report Form and hide Reports Section by default
    function showReportForm() {
      reportFormSection.classList.remove("hidden");
      reportsSection.classList.add("hidden");
      pageTitle.textContent = "Report an Incident";
      newReportBtn.classList.add("active");
      viewReportsBtn.classList.remove("active");
    }
  
    // Show Reports Section and hide Report Form
    function showReports() {
      reportFormSection.classList.add("hidden");
      reportsSection.classList.remove("hidden");
      pageTitle.textContent = "My Reports";
      newReportBtn.classList.remove("active");
      viewReportsBtn.classList.add("active");
      checkReports();
    }
  
    // Handle form submission and store data in localStorage
    if (reportForm) {
      reportForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const issueType = document.getElementById("issue-type").value;
        const description = document.getElementById("description").value;
  
        const report = {
          id: Date.now(),
          name,
          email,
          issueType,
          description,
          createdAt: new Date().toISOString()
        };
  
        let reports = JSON.parse(localStorage.getItem("issueReports")) || [];
        reports.push(report);
        localStorage.setItem("issueReports", JSON.stringify(reports));
  
        reportForm.reset();
        showReports();
      });
    }
  
    // Display stored reports
    function displayReports(reports) {
      reportsContainer.innerHTML = "";
      reports.forEach(report => {
        const reportCard = document.createElement("div");
        reportCard.classList.add("report-card");
        reportCard.innerHTML = `
          <div class="report-header">
            <strong>${report.issueType}</strong> - ${new Date(report.createdAt).toLocaleString()}
          </div>
          <div class="report-content">
            <p><strong>Name:</strong> ${report.name}</p>
            <p><strong>Email:</strong> ${report.email}</p>
            <p><strong>Description:</strong> ${report.description}</p>
          </div>
        `;
        reportsContainer.appendChild(reportCard);
      });
    }
  
    // Event Listeners
    newReportBtn.addEventListener("click", showReportForm);
    viewReportsBtn.addEventListener("click", showReports);
  
    if (createFirstReportBtn) {
      createFirstReportBtn.addEventListener("click", showReportForm);
    }
    
    // Initial check for reports on load
    checkReports();
  });
  