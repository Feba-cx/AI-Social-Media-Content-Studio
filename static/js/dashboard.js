
const agentStages = [
    ["research", "Market researcher", "Reviewing available topic signals"],
    ["strategy", "Content strategist", "Preparing a content brief"],
    ["writer", "Content writer", "Preparing content for review"],
    ["creative", "Creative planner", "Preparing a creative concept"],
    ["review", "Review coordinator", "Routing the result to approval"]
];

let workflowRunning = false;

function setAgentStatus(agent, status) {
    const element = document.getElementById(`status-${agent}`);
    if (!element) return;

    element.textContent = status;
    element.className = "agent-status " + status.toLowerCase();
}

function addActivity(title, detail) {
    const list = document.getElementById("activity-list");

    if (list.querySelector(".empty-state")) {
        list.innerHTML = "";
    }

    const entry = document.createElement("div");
    entry.className = "activity-entry";

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "check-circle-2");

    const content = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = title;

    const description = document.createElement("small");
    description.textContent = detail;

    content.append(heading, description);
    entry.append(icon, content);
    list.prepend(entry);

    if (window.lucide) lucide.createIcons();
}

async function loadDashboard() {
    try {
        const response = await fetch("/api/drafts");
        if (!response.ok) throw new Error("Unable to load drafts");

        const drafts = await response.json();
        document.getElementById("draft-count").textContent = drafts.length;
    } catch (error) {
        console.error("Draft loading failed:", error);
    }

    // These are illustrative signals, not live trend detections.
    document.getElementById("trend-count").textContent = "3";
    document.getElementById("active-agents").innerHTML = '0 <span>/ 5</span>';
}

async function runWorkflow() {
    if (workflowRunning) return;

    workflowRunning = true;
    const button = document.getElementById("start-workflow");
    button.disabled = true;
    button.textContent = "Workflow running...";

    document.getElementById("active-agents").innerHTML = '1 <span>/ 5</span>';

    addActivity("Workflow started", "Using illustrative demo signals.");

    try {
        for (const [agent, name, detail] of agentStages) {
            setAgentStatus(agent, "Running");
            addActivity(name, detail);

            // Simulates visible stage progression in the prototype.
            await new Promise(resolve => setTimeout(resolve, 650));

            setAgentStatus(agent, "Done");
        }

        const approvalList = document.getElementById("approval-list");
        approvalList.className = "";
        approvalList.innerHTML = `
            <div class="activity-entry">
                <i data-lucide="file-check-2"></i>
                <div>
                    <strong>Content workflow completed</strong>
                    <small>Demo workflow · Review the generated content in Content Studio.</small>
                </div>
            </div>
            <p style="margin-top:14px;color:#858da4;font-size:11px">
                No content was published. This workflow demonstrates the agent stages only.
            </p>`;

        document.getElementById("pending-count").textContent = "1";
        document.getElementById("approval-count").textContent = "1";
        document.getElementById("approval-label").textContent = "1 ITEM";

        addActivity("Workflow completed", "Demo stages finished. No external services were called.");

        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error(error);
        addActivity("Workflow error", "Please refresh and try again.");
    } finally {
        workflowRunning = false;
        button.disabled = false;
        button.innerHTML = '<i data-lucide="play"></i> Run agent workflow';
        document.getElementById("active-agents").innerHTML = '0 <span>/ 5</span>';

        if (window.lucide) lucide.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();

    document.getElementById("start-workflow")
        .addEventListener("click", runWorkflow);

    document.getElementById("refresh-dashboard")
        .addEventListener("click", loadDashboard);

    document.querySelectorAll(".use-trend").forEach(button => {
        button.addEventListener("click", () => {
            const topic = button.dataset.topic;
            sessionStorage.setItem("contentStudioTopic", topic);
            window.location.href = "/content-studio";
        });
    });
});
