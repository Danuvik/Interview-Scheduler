let entryCount = 0;

// Set today's date as default
document.getElementById('date').value = new Date().toISOString().split('T')[0];

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = ''; // Clear previous alerts
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function updateEntryCount() {
    const tableBody = document.getElementById('tableBody');
    const dataRows = tableBody.querySelectorAll('tr:not(.empty-state)');
    const count = dataRows.length;
    document.getElementById('entryCount').textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;

    const emptyState = tableBody.querySelector('.empty-state');
    if (count > 0 && emptyState) {
        emptyState.style.display = 'none';
    } else if (count === 0 && !emptyState) {
        showEmptyState();
    } else if (count === 0 && emptyState) {
        emptyState.style.display = 'table-row';
    }
}

function showEmptyState() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr class="empty-state">
            <td colspan="7">
                <h3>No entries yet</h3>
                <p>Add your first entry above to get started</p>
            </td>
        </tr>
    `;
}

function sortTable() {
    const tbody = document.getElementById('tableBody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.empty-state)'));
    
    rows.sort((a, b) => {
        const dateA = a.querySelector('input[type="date"]').value;
        const timeA = a.querySelector('input[type="time"]').value;
        const dateB = b.querySelector('input[type="date"]').value;
        const timeB = b.querySelector('input[type="time"]').value;
        
        const datetimeA = `${dateA}T${timeA}`;
        const datetimeB = `${dateB}T${timeB}`;
        
        return datetimeA.localeCompare(datetimeB);
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

function addRow() {
    const regNumber = document.getElementById('regNumber').value.trim();
    const name = document.getElementById('name').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const duration = document.getElementById('duration').value;
    const date = document.getElementById('date').value;
    const roomNumber = document.getElementById('roomNumber').value.trim();

    if (!regNumber || !name || !companyName || !duration || !date || !roomNumber) {
        showAlert("Please fill in all fields.", "error");
        return;
    }

    const newEntry = { regNumber, name, companyName, duration, date, roomNumber };

    fetch('http://localhost:3000/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.id) {
            showAlert("Entry added successfully!", "success");
            const tbody = document.getElementById('tableBody');
            const newRow = document.createElement('tr');
            newRow.dataset.id = data.id;
            
            newRow.innerHTML = `
                <td><input type="text" class="table-input" value="${regNumber}" disabled></td>
                <td><input type="text" class="table-input" value="${name}" disabled></td>
                <td><input type="text" class="table-input" value="${companyName}" disabled></td>
                <td><input type="time" class="table-input" value="${duration}" disabled></td>
                <td><input type="date" class="table-input" value="${date}" disabled></td>
                <td><input type="text" class="table-input" value="${roomNumber}" disabled></td>
                <td>
                    <button class="edit-btn" onclick="toggleEdit(this)">Edit</button>
                    <button class="delete-btn" onclick="deleteRow(this)">Delete</button>
                </td>
            `;

            tbody.appendChild(newRow);
            newRow.classList.add('fade-in');
            
            sortTable();
            updateEntryCount();

            // Clear inputs
            document.getElementById('regNumber').value = '';
            document.getElementById('name').value = '';
            document.getElementById('companyName').value = '';
            document.getElementById('duration').value = '';
            document.getElementById('roomNumber').value = '';
        } else {
            throw new Error('Failed to get new entry ID from server.');
        }
    })
    .catch(err => {
        console.error('Error saving entry:', err);
        showAlert('Failed to save entry. Please check the console for details.', 'error');
    });
}

function toggleEdit(button) {
    const row = button.closest('tr');
    const inputs = row.querySelectorAll('.table-input');
    
    if (button.textContent === 'Edit') {
        inputs.forEach(input => input.disabled = false);
        button.textContent = 'Save';
        button.classList.add('save');
        inputs[0].focus(); // Focus on the first input
    } else {
        const id = row.dataset.id;
        const updatedEntry = {
            regNumber: inputs[0].value.trim(),
            name: inputs[1].value.trim(),
            companyName: inputs[2].value.trim(),
            duration: inputs[3].value,
            date: inputs[4].value,
            roomNumber: inputs[5].value.trim(),
        };

        if (Object.values(updatedEntry).some(val => val === '')) {
            showAlert("All fields are required when saving.", "error");
            return;
        }

        fetch(`http://localhost:3000/update-entry/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEntry)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update');
            return response.json();
        })
        .then(data => {
            showAlert("Entry updated successfully!", "success");
            inputs.forEach(input => input.disabled = true);
            button.textContent = 'Edit';
            button.classList.remove('save');
            sortTable();
        })
        .catch(err => {
            console.error('Error updating entry:', err);
            showAlert('Failed to update entry.', 'error');
        });
    }
}

function deleteRow(button) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const row = button.closest('tr');
        const id = row.dataset.id;
        
        fetch(`http://localhost:3000/delete-entry/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete');
            return response.json();
        })
        .then(data => {
            row.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                row.remove();
                updateEntryCount();
                showAlert("Entry deleted successfully!", "success");
            }, 300);
        })
        .catch(err => {
            console.error('Error deleting entry:', err);
            showAlert('Failed to delete entry from the database.', 'error');
        });
    }
}
// Add this new function to your script.js file

function filterTable() {
    const filter = document.getElementById('searchInput').value.toUpperCase();
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const noResults = document.getElementById('noResults');
    let visibleRowCount = 0;

    for (let i = 0; i < rows.length; i++) {
        // Skip the 'empty-state' row
        if (rows[i].classList.contains('empty-state')) continue;

        const cells = rows[i].getElementsByTagName('td');
        let match = false;
        // Loop through all cells except the last one (actions buttons)
        for (let j = 0; j < cells.length - 1; j++) {
            const input = cells[j].getElementsByTagName('input')[0];
            if (input && input.value.toUpperCase().indexOf(filter) > -1) {
                match = true;
                break;
            }
        }

        if (match) {
            rows[i].style.display = "";
            visibleRowCount++;
        } else {
            rows[i].style.display = "none";
        }
    }

    // Show or hide the "no results" message
    if (visibleRowCount === 0 && !tableBody.querySelector('.empty-state')) {
        noResults.style.display = "block";
    } else {
        noResults.style.display = "none";
    }
}

// Ensure the rest of your script.js remains the same.