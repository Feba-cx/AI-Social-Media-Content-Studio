
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("content-form");
    const topicInput = document.getElementById("topic");
    const contentTypeInput = document.getElementById("content-type");
    const platformInput = document.getElementById("platform");
    const toneInput = document.getElementById("tone");
    const lengthInput = document.getElementById("length");

    const outputElement = document.getElementById("generated-content");
    const resultArea = document.getElementById("result-area");
    const emptyOutput = document.getElementById("empty-output");
    const outputStatus = document.getElementById("output-status");
    const feedback = document.getElementById("feedback");

    const generateButton = document.getElementById("generate-button");
    const copyButton = document.getElementById("copy-button");
    const saveButton = document.getElementById("save-button");

    const imagePrompt = document.getElementById("image-prompt");
    const generateImageButton = document.getElementById("generate-image-button");
    const imageStatus = document.getElementById("image-status");
    const imageResult = document.getElementById("image-result");
    const generatedImage = document.getElementById("generated-image");
    const downloadImage = document.getElementById("download-image");

    // AI Voice Generator elements
    const audioText = document.getElementById("audio-text");
    const generateAudioButton = document.getElementById("generate-audio-button");
    const audioStatus = document.getElementById("audio-status");
    const audioResult = document.getElementById("audio-result");
    const generatedAudio = document.getElementById("generated-audio");
    const downloadAudio = document.getElementById("download-audio");

    const submitApprovalButton = document.getElementById("submit-approval-button");

    let generatedContent = "";
    let currentDraftId = null;

    const savedTopic = sessionStorage.getItem("contentStudioTopic");

    if (savedTopic && topicInput) {
        topicInput.value = savedTopic;
        sessionStorage.removeItem("contentStudioTopic");
    }

    function getValue(element, fallback = "") {
        return element ? element.value.trim() || fallback : fallback;
    }

    function setOutput(content) {
        generatedContent = content;

        if (outputElement) outputElement.value = content;
        if (resultArea) resultArea.hidden = !content;
        if (emptyOutput) emptyOutput.hidden = Boolean(content);

        if (outputStatus) {
            outputStatus.textContent = content
                ? "Content generated"
                : "Waiting for input";
        }

        if (feedback) feedback.textContent = "";
        if (copyButton) copyButton.disabled = !content;
        if (saveButton) saveButton.disabled = !content;
        if (submitApprovalButton) submitApprovalButton.disabled = !content.trim();
    }

    function setButtonLoading(button, loading, originalText) {
        if (!button) return;
        button.disabled = loading;
        button.textContent = loading ? "Please wait..." : originalText;
    }

    // Keep the generated text synchronized when the user edits it.
    if (outputElement) {
        outputElement.addEventListener("input", () => {
            generatedContent = outputElement.value;
            if (copyButton) copyButton.disabled = !generatedContent.trim();
            if (saveButton) saveButton.disabled = !generatedContent.trim();
            if (submitApprovalButton) submitApprovalButton.disabled = !generatedContent.trim();
        });
    }

    // Generate text content.
    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const topic = getValue(topicInput);

            if (!topic) {
                alert("Please enter a topic first.");
                topicInput?.focus();
                return;
            }

            const originalText = generateButton?.textContent || "Generate content";
            setButtonLoading(generateButton, true, originalText);

            try {
                const result = await apiRequest("/api/generate", {
                    method: "POST",
                    body: JSON.stringify({
                        topic,
                        content_type: getValue(contentTypeInput, "Social media post"),
                        platform: getValue(platformInput, "Instagram"),
                        tone: getValue(toneInput, "Professional"),
                        length: getValue(lengthInput, "Medium")
                    })
                });

                setOutput(result.content || "");
                currentDraftId = null;

            } catch (error) {
                console.error("Content generation failed:", error);
                alert(error.message || "Unable to generate content.");
            } finally {
                setButtonLoading(generateButton, false, originalText);
            }
        });
    }

    // Copy text content.
    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            if (!generatedContent.trim()) {
                alert("Generate some content first.");
                return;
            }

            try {
                await navigator.clipboard.writeText(generatedContent);
                copyButton.textContent = "Copied!";

                setTimeout(() => {
                    copyButton.innerHTML = '<i data-lucide="copy"></i> Copy';
                    if (window.lucide) lucide.createIcons();
                }, 1500);
            } catch (error) {
                console.error("Copy failed:", error);
                alert("Could not copy automatically. Please select and copy the text.");
            }
        });
    }

    // Save text content as a draft.
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            if (!generatedContent.trim()) {
                alert("Generate some content before saving.");
                return;
            }

            const originalText = saveButton.textContent;
            setButtonLoading(saveButton, true, originalText);

            try {
                const result = await apiRequest("/api/drafts", {
                    method: "POST",
                    body: JSON.stringify({
                        id: currentDraftId,
                        title: getValue(topicInput, "Untitled Draft"),
                        type: getValue(contentTypeInput, "Social media post"),
                        platform: getValue(platformInput, "General"),
                        content: generatedContent
                    })
                });

                currentDraftId = result.id || currentDraftId;
                alert("Draft saved successfully!");

            } catch (error) {
                console.error("Saving draft failed:", error);
                alert(error.message || "Unable to save the draft.");
            } finally {
                setButtonLoading(saveButton, false, originalText);
            }
        });
    }

    // Generate an image through the Flask backend.
    if (generateImageButton) {
        generateImageButton.addEventListener("click", async () => {
            const prompt = getValue(imagePrompt) || getValue(topicInput);

            if (!prompt) {
                alert("Enter an image description or a topic first.");
                imagePrompt?.focus();
                return;
            }

            const originalText = generateImageButton.textContent;
            generateImageButton.disabled = true;
            generateImageButton.textContent = "Generating image...";

            if (imageStatus) {
                imageStatus.textContent =
                    "Generating locally. This may take several minutes.";
            }

            if (imageResult) imageResult.hidden = true;

            try {
                const result = await apiRequest("/api/generate-image", {
                    method: "POST",
                    body: JSON.stringify({ prompt })
                });

                if (!result.image_url) {
                    throw new Error("The server did not return an image URL.");
                }

                const imageUrl = result.image_url;
                generatedImage.src = imageUrl;
                downloadImage.href = imageUrl;
                imageResult.hidden = false;

                if (imageStatus) imageStatus.textContent = "Image generated successfully.";

            } catch (error) {
                console.error("Image generation failed:", error);

                if (imageStatus) {
                    imageStatus.textContent =
                        error.message || "Image generation failed.";
                }
            } finally {
                generateImageButton.disabled = false;
                generateImageButton.textContent = originalText;
                if (window.lucide) lucide.createIcons();
            }
        });

    
    // Generate voice using the local Piper TTS service.
    if (generateAudioButton) {
        generateAudioButton.addEventListener("click", async () => {
            const text = audioText?.value.trim() || generatedContent.trim();

            if (!text) {
                if (audioStatus) {
                    audioStatus.textContent =
                        "Generate content above or enter text for the voice.";
                }
                audioText?.focus();
                return;
            }

            const originalText = generateAudioButton.innerHTML;
            generateAudioButton.disabled = true;
            generateAudioButton.textContent = "Generating voice...";

            if (audioStatus) {
                audioStatus.textContent =
                    "Generating speech locally. Please wait...";
            }

            if (audioResult) audioResult.hidden = true;

            try {
                const result = await apiRequest("/api/generate-audio", {
                    method: "POST",
                    body: JSON.stringify({ text })
                });

                if (!result.audio_url) {
                    throw new Error("The server did not return an audio file.");
                }

                generatedAudio.src = result.audio_url;
                generatedAudio.load();

                downloadAudio.href = result.audio_url;
                audioResult.hidden = false;

                if (audioStatus) {
                    audioStatus.textContent =
                        "Voice generated successfully. Press play to listen.";
                }
            } catch (error) {
                console.error("Voice generation failed:", error);

                if (audioStatus) {
                    audioStatus.textContent =
                        error.message || "Unable to generate voice.";
                }
            } finally {
                generateAudioButton.disabled = false;
                generateAudioButton.innerHTML = originalText;

                if (window.lucide) lucide.createIcons();
            }
        });
    }
    
    
    // Submit generated content to the human approval queue.
    if (submitApprovalButton) {
        submitApprovalButton.addEventListener("click", async () => {
            const content = outputElement?.value.trim() || "";

            if (!content) {
                alert("Generate some content before submitting for approval.");
                return;
            }

            const originalHTML = submitApprovalButton.innerHTML;
            submitApprovalButton.disabled = true;
            submitApprovalButton.textContent = "Submitting...";

            try {
                const result = await apiRequest("/api/approvals", {
                    method: "POST",
                    body: JSON.stringify({
                        title: getValue(topicInput, "Untitled social post"),
                        content: content,
                        platform: getValue(platformInput, "General"),
                        image_url: generatedImage?.src &&
                            imageResult && !imageResult.hidden
                            ? generatedImage.getAttribute("src")
                            : ""
                    })
                });

                if (feedback) {
                    feedback.textContent =
                        result.message || "Submitted for approval successfully.";
                }

                alert("Submitted for approval! Open the Approval Queue to review it.");
            } catch (error) {
                console.error("Approval submission failed:", error);
                if (feedback) {
                    feedback.textContent =
                        error.message || "Unable to submit for approval.";
                }
            } finally {
                submitApprovalButton.disabled = !outputElement?.value.trim();
                submitApprovalButton.innerHTML = originalHTML;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

        
    }
});
