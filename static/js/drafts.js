
document.addEventListener("DOMContentLoaded", () => {
    const draftList = document.getElementById("draft-list");
    const emptyDrafts = document.getElementById("empty-drafts");
    const draftCount = document.getElementById("draft-count");
    const feedback = document.getElementById("draft-feedback");
    const refreshButton = document.getElementById("refresh-drafts");

    let drafts = [];

    function showFeedback(message, isError = false) {
        feedback.textContent = message;
        feedback.classList.toggle("error", isError);
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }

    function createButton(label, iconName, className, onClick) {
        const button = createElement(
            "button",
            className,
            ""
        );

        button.type = "button";

        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", iconName);
        button.append(icon, document.createTextNode(" " + label));

        button.addEventListener("click", onClick);

        return button;
    }

    function renderDrafts() {
        draftList.replaceChildren();
        draftCount.textContent =
            `${drafts.length} saved ${drafts.length === 1 ? "draft" : "drafts"}`;

        emptyDrafts.hidden = drafts.length > 0;
        draftList.hidden = drafts.length === 0;

        drafts.forEach((draft) => {
            const card = createElement("article", "draft-card");
            const top = createElement("div", "draft-card-top");
            const heading = createElement("h3", "", draft.title || "Untitled Draft");

            top.appendChild(heading);

            const meta = createElement("div", "draft-meta");
            meta.append(
                createElement("span", "draft-tag", draft.platform || "General"),
                createElement("span", "draft-tag", draft.type || "Social media post")
            );

            const preview = createElement(
                "p",
                "draft-preview",
                draft.content || ""
            );

            const editor = createElement("div", "draft-editor");
            editor.hidden = true;

            const titleInput = createElement("input", "draft-title-input");
            titleInput.type = "text";
            titleInput.value = draft.title || "";
            titleInput.maxLength = 200;
            titleInput.setAttribute("aria-label", "Draft title");

            const contentInput = createElement("textarea", "draft-content-input");
            contentInput.value = draft.content || "";
            contentInput.setAttribute("aria-label", "Draft content");

            editor.append(titleInput, contentInput);

            const actions = createElement("div", "draft-actions");

            const editButton = createButton(
                "Edit",
                "pencil",
                "secondary-button",
                () => {
                    editor.hidden = false;
                    titleInput.focus();
                    editButton.hidden = true;
                    preview.hidden = true;
                }
            );

            const saveButton = createButton(
                "Save changes",
                "save",
                "primary-button",
                async () => {
                    const title = titleInput.value.trim() || "Untitled Draft";
                    const content = contentInput.value.trim();

                    if (!content) {
                        showFeedback("Draft content cannot be empty.", true);
                        return;
                    }

                    saveButton.disabled = true;

                    try {
                        await apiRequest("/api/drafts", {
                            method: "POST",
                            body: JSON.stringify({
                                id: draft.id,
                                title,
                                type: draft.type || "Social media post",
                                platform: draft.platform || "General",
                                content
                            })
                        });

                        showFeedback("Draft updated successfully.");
                        await loadDrafts();
                    } catch (error) {
                        showFeedback(error.message || "Could not update draft.", true);
                    } finally {
                        saveButton.disabled = false;
                    }
                }
            );

            const cancelButton = createButton(
                "Cancel",
                "x",
                "secondary-button",
                () => {
                    editor.hidden = true;
                    preview.hidden = false;
                    editButton.hidden = false;
                    titleInput.value = draft.title || "";
                    contentInput.value = draft.content || "";
                    showFeedback("");
                }
            );
            
            
                const approvalButton = createButton(
                    "Send for Approval",
                    "send",
                    "primary-button",
                    async () => {
                        if (!draft.content || !draft.content.trim()) {
                            showFeedback("Draft content cannot be empty.", true);
                            return;
                        }

                        approvalButton.disabled = true;
                        showFeedback("Submitting draft for approval...");

                        try {
                            const result = await apiRequest("/api/approvals", {
                                method: "POST",
                                body: JSON.stringify({
                                draft_id: draft.id,
                                title: draft.title || "Untitled Draft",
                                content: draft.content,
                                platform: draft.platform || "General"
                            })
                        });

                        showFeedback(
                            result.message || "Draft sent for approval successfully."
                        );

                        approvalButton.textContent = "Sent for Approval";
                        approvalButton.disabled = true;
                    } catch (error) {
                        showFeedback(
                            error.message || "Could not submit draft for approval.",
                            true
                        );
                        approvalButton.disabled = false;
                    }
                }
            );




            const deleteButton = createButton(
                "Delete",
                "trash-2",
                "secondary-button delete-button",
                async () => {
                    const confirmed = window.confirm(
                        `Delete "${draft.title || "Untitled Draft"}"? This cannot be undone.`
                    );

                    if (!confirmed) return;

                    deleteButton.disabled = true;

                    try {
                        await apiRequest(
                            `/api/drafts/${encodeURIComponent(draft.id)}`,
                            { method: "DELETE" }
                        );

                        showFeedback("Draft deleted successfully.");
                        await loadDrafts();
                    } catch (error) {
                        showFeedback(error.message || "Could not delete draft.", true);
                        deleteButton.disabled = false;
                    }
                }
            );

            saveButton.hidden = true;
            cancelButton.hidden = true;

            editButton.addEventListener("click", () => {
                saveButton.hidden = false;
                cancelButton.hidden = false;
            });

            cancelButton.addEventListener("click", () => {
                saveButton.hidden = true;
                cancelButton.hidden = true;
            });

            saveButton.addEventListener("click", () => {
                // Keep the editor controls available if saving fails.
                saveButton.hidden = false;
                cancelButton.hidden = false;
            });

            actions.append(editButton, saveButton, cancelButton,  approvalButton, deleteButton);
            card.append(top, meta, preview, editor, actions);
            draftList.appendChild(card);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async function loadDrafts() {
        refreshButton.disabled = true;
        draftCount.textContent = "Loading drafts...";

        try {
            const result = await apiRequest("/api/drafts");
            drafts = Array.isArray(result) ? result : [];
            renderDrafts();
        } catch (error) {
            draftCount.textContent = "Could not load drafts";
            showFeedback(error.message || "Failed to load saved drafts.", true);
        } finally {
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener("click", () => {
        showFeedback("");
        loadDrafts();
    });

    loadDrafts();
});
