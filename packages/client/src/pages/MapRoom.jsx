import React, { useEffect, useState } from 'react';
import { Card, Button, Input } from '../components/ui';
import useKnowledgeStore from '../stores/knowledgeStore';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import AddKnowledgeForm from '../components/knowledge/AddKnowledgeForm';

const MapRoom = () => {
  const {
    items,
    stats,
    searchResults,
    searchQuery,
    loading,
    error,
    fetchItems,
    fetchStats,
    search,
    addItem,
    deleteItem,
    clearSearch,
    clearError
  } = useKnowledgeStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      search(localSearchQuery);
    } else {
      clearSearch();
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      await addItem(itemData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const displayItems = searchQuery ? searchResults : items;

  return (
    <div className="space-y-8">
      {/* Hero Header with Image */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/map-room-header.png"
          alt="Map Room"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            📍 Map Room
          </h1>
          <p className="text-lg text-vintage-text opacity-90 drop-shadow">
            Second Brain - Knowledge Management
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="canvas" className="text-center border-teal">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {stats.totalItems}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Total Items
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-jungle">
            <div className="text-4xl mb-2">🗂️</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {stats.categories.length}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Categories
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-mustard">
            <div className="text-4xl mb-2">🏷️</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {stats.tags.length}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Unique Tags
            </p>
          </Card>

          <Card variant="canvas" className="text-center border-sunset">
            <div className="text-4xl mb-2">⭐</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-1">
              {stats.mostAccessed[0]?.accessCount || 0}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Most Accessed
            </p>
          </Card>
        </div>
      )}

      {/* Search and Add */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search knowledge with semantic AI search..."
            className="flex-1"
          />
          <Button type="submit">Search</Button>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocalSearchQuery('');
                clearSearch();
              }}
            >
              Clear
            </Button>
          )}
        </form>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Item'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-center justify-between">
            <p className="text-terracotta-dark">
              <strong>Error:</strong> {error}
            </p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Add Form */}
      {showAddForm && (
        <AddKnowledgeForm
          onSubmit={handleAddItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="text-center">
          <p className="text-vintage-text">
            Found {searchResults.length} results for <strong>"{searchQuery}"</strong>
          </p>
        </div>
      )}

      {/* Knowledge Items */}
      {loading && displayItems.length === 0 ? (
        <Card>
          <p className="text-center text-vintage-text py-8">
            Loading knowledge items...
          </p>
        </Card>
      ) : displayItems.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-vintage-text mb-4">
              {searchQuery ? 'No items found matching your search.' : 'No knowledge items yet.'}
            </p>
            <p className="text-sm text-vintage-text opacity-70">
              {searchQuery ? 'Try a different search term.' : 'Add your first item to start building your knowledge base.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item) => (
            <KnowledgeCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={(item) => alert('Edit functionality coming soon!')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MapRoom;
