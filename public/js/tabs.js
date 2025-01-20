document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all content
            const contents = document.querySelectorAll('.day-content');
            contents.forEach(content => content.style.display = 'none');
            
            // Show selected content
            const day = tab.dataset.day;
            const selectedContent = document.getElementById(day);
            const adminContent = document.getElementById(`admin-${day}`);
            
            if (selectedContent) selectedContent.style.display = 'block';
            if (adminContent) adminContent.style.display = 'block';
        });
    });
}); 