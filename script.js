const bookForm = document.getElementById('bookForm');
const bookList = document.getElementById('bookList');
const searchInput = document.getElementById('searchInput');
const sortField = document.getElementById('sortField');
const sortOrder = document.getElementById('sortOrder');
const exportJson = document.getElementById('exportJson');
const exportCsv = document.getElementById('exportCsv');
const importFile = document.getElementById('importFile');

let books = JSON.parse(localStorage.getItem('books')) || [];
reloadUI();

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  if (title && author) {
    const book = { title, author };
    books.push(book);
    localStorage.setItem('books', JSON.stringify(books));
    reloadUI();
    bookForm.reset();
  }
});

function addBookToUI(book, index) {
  const li = document.createElement('li');
  const bookText = document.createElement('span');
  bookText.textContent = `${book.title} by ${book.author}`;
  li.appendChild(bookText);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    li.classList.add('fade-out');
    setTimeout(() => {
      books.splice(index, 1);
      localStorage.setItem('books', JSON.stringify(books));
      reloadUI();
    }, 400);
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    const titleInput = document.createElement('input');
    const authorInput = document.createElement('input');
    const saveBtn = document.createElement('button');

    titleInput.value = book.title;
    authorInput.value = book.author;
    titleInput.placeholder = 'Title';
    authorInput.placeholder = 'Author';
    saveBtn.textContent = 'Save';
    saveBtn.className = 'edit-btn';

    li.innerHTML = '';
    li.appendChild(titleInput);
    li.appendChild(authorInput);
    li.appendChild(saveBtn);

    saveBtn.addEventListener('click', () => {
      const newTitle = titleInput.value.trim();
      const newAuthor = authorInput.value.trim();
      if (newTitle && newAuthor) {
        books[index] = { title: newTitle, author: newAuthor };
        localStorage.setItem('books', JSON.stringify(books));
        reloadUI();
      }
    });
  });

  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
  bookList.appendChild(li);
}

function reloadUI() {
  bookList.innerHTML = '';
  books.forEach((book, i) => addBookToUI(book, i));
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  const query = searchInput.value.toLowerCase();
  const field = sortField.value;
  const order = sortOrder.value;

  let filtered = books.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query)
  );

  filtered.sort((a, b) => {
    const valA = a[field].toLowerCase();
    const valB = b[field].toLowerCase();
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  bookList.innerHTML = '';
  filtered.forEach((book, i) => {
    const index = books.findIndex(
      b => b.title === book.title && b.author === book.author
    );
    addBookToUI(book, index);
  });
}

searchInput.addEventListener('input', applyFiltersAndSort);
sortField.addEventListener('change', applyFiltersAndSort);
sortOrder.addEventListener('change', applyFiltersAndSort);

exportJson.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, 'books.json');
});

exportCsv.addEventListener('click', () => {
  const csv = "Title,Author\n" + books.map(b => \`\${b.title},\${b.author}\`).join("\n");
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, 'books.csv');
});

importFile.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const ext = file.name.split('.').pop().toLowerCase();

  reader.onload = (e) => {
    const content = e.target.result;
    let importedBooks = [];

    try {
      if (ext === 'json') {
        importedBooks = JSON.parse(content);
      } else if (ext === 'csv') {
        const lines = content.trim().split('\n').slice(1);
        importedBooks = lines.map(line => {
          const [title, author] = line.split(',').map(cell => cell.replace(/"/g, '').trim());
          return { title, author };
        });
      } else {
        alert('Unsupported file type.');
        return;
      }

      importedBooks = importedBooks.filter(book =>
        book.title && book.author &&
        !books.some(b => b.title === book.title && b.author === book.author)
      );

      books.push(...importedBooks);
      localStorage.setItem('books', JSON.stringify(books));
      reloadUI();
      alert(`${importedBooks.length} books imported successfully.`);
    } catch (err) {
      alert('Error importing file. Please check the format.');
    }
  };

  reader.readAsText(file);
});

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
