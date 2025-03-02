const Header = () => {
  return (
    <header className="bg-white shadow-sm px-8 py-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center px-8">
        <h1 className="text-xl font-semibold text-gray-900">Menu App</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="/" className="text-gray-600 hover:text-gray-900">Ana Sayfa</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 