document.addEventListener('DOMContentLoaded', function() {
    const campaignNameInput = document.getElementById('campaignName');
    const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // Removes hyphens
    // Default value = "newsletter"+today's date in ISO format without hyphens
    campaignNameInput.value = `newsletter${today}`;

    document.getElementById('copyBtn').addEventListener('click', function() {
        const copyBtn = this;
        const originalText = copyBtn.textContent;
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('editor'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';

        // Revert label after timeout
        setTimeout(function() {
            copyBtn.textContent = originalText;
        }, 1000);
    });

    document.getElementById('applyTracking').addEventListener('click', function() {
        const editor = document.getElementById('editor');
        const trackingParam = document.getElementById('trackingParameter').value;
        const campaignName = campaignNameInput.value;
        const domains = document.getElementById('domains').value.split('\n').map(d => d.trim()).filter(d => d);
        const resultsDiv = document.getElementById('results');

        const links = editor.querySelectorAll('a');
        let updatedCount = 0;

        links.forEach(link => {
            const url = new URL(link.href);
            if (domains.includes(url.hostname)) {
                if (url.searchParams.has(trackingParam)) {
                    url.searchParams.set(trackingParam, campaignName);
                } else {
                    url.searchParams.append(trackingParam, campaignName);
                }
                link.href = url.toString();
                updatedCount++;
            }
        });

        // Render inline progress update and scroll it into view
        resultsDiv.textContent = updatedCount > 0 ? `${updatedCount} links updated.` : 'No matching links found.';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
});
