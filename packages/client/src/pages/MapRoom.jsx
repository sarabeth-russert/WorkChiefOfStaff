import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Input } from '../components/ui';
import useKnowledgeStore from '../stores/knowledgeStore';
import useToastStore from '../stores/toastStore';
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
    updateItem,
    clearSearch,
    clearError
  } = useKnowledgeStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const expandedPanelRef = useRef(null);

  useEffect(() => {
    if (expandedItem && expandedPanelRef.current) {
      expandedPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedItem]);

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
      // Error handled by store
    }
  };

  const handleDelete = async (itemId) => {
    const confirmed = await useToastStore.getState().confirm(
      'Are you sure you want to delete this item?',
      { title: 'Delete Item', confirmLabel: 'Delete', cancelLabel: 'Cancel' }
    );
    if (confirmed) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const displayItems = searchQuery ? searchResults : items;

  return (
    <div className="space-y-8">
      {/* Hero — let the art breathe */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage mb-2">
        <img
          src="/images/pages/map-room-header.png"
          alt="Map Room archives"
          className="w-full h-52 md:h-72 object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
        <div className="absolute top-4 left-4">
          <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
            Knowledge Archives
          </span>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
          Map Room
        </h1>
        <p className="font-serif text-vintage-text/50 text-base italic">
          Collected intelligence and expedition notes
        </p>
      </div>

      {/* Catalog instruments */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 px-4 py-3 text-center">
            <div className="text-2xl mb-1">{'\u{1F4DA}'}</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-0.5">{stats.totalItems}</h3>
            <p className="font-ui uppercase text-[10px] tracking-widest text-vintage-text/50">Volumes Cataloged</p>
          </div>
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 px-4 py-3 text-center">
            <div className="text-2xl mb-1">{'\u{1F5C4}'}</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-0.5">{stats.categories.length}</h3>
            <p className="font-ui uppercase text-[10px] tracking-widest text-vintage-text/50">Subject Shelves</p>
          </div>
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 px-4 py-3 text-center">
            <div className="text-2xl mb-1">{'\u{1F3F7}'}</div>
            <h3 className="text-3xl font-poster text-vintage-text mb-0.5">{stats.tags.length}</h3>
            <p className="font-ui uppercase text-[10px] tracking-widest text-vintage-text/50">Expedition Tags</p>
          </div>
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 px-4 py-3 text-center">
            <div className="text-2xl mb-1">{'\u{2B50}'}</div>
            {stats.mostAccessed[0]?.accessCount > 0 ? (
              <h3 className="text-3xl font-poster text-vintage-text mb-0.5">{stats.mostAccessed[0].accessCount}</h3>
            ) : (
              <h3 className="text-2xl font-serif text-vintage-text/20 italic mb-0.5">&mdash;</h3>
            )}
            <p className="font-ui uppercase text-[10px] tracking-widest text-vintage-text/50">Most Consulted</p>
            {!stats.mostAccessed[0]?.accessCount && (
              <p className="font-serif text-[10px] text-vintage-text/25 italic mt-1">No featured references yet</p>
            )}
          </div>
        </div>
      )}

      {/* Archive Query — dossier strip with floating label */}
      <div className="relative border-2 border-sand-dark/30 rounded-lg bg-cream/40 px-5 py-4 mt-2">
        <div className="absolute -top-3 left-5">
          <span className="bg-sand px-3 py-0.5 font-ui text-[10px] uppercase tracking-[0.2em] text-vintage-text/50 border border-sand-dark/20 rounded-sm">
            Archive Query
          </span>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          <Input
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search the archives with semantic AI..."
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
          <div className="w-px h-8 bg-sand-dark/20 hidden sm:block" />
          <Button
            variant="primary"
            onClick={() => setShowAddForm(!showAddForm)}
            className="whitespace-nowrap"
          >
            {showAddForm ? 'Cancel' : '+ File Record'}
          </Button>
        </form>
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
          <p className="font-serif text-vintage-text/70 text-sm italic">
            {searchResults.length} record{searchResults.length !== 1 ? 's' : ''} retrieved for <strong>"{searchQuery}"</strong>
          </p>
        </div>
      )}

      {/* Expanded Item Panel */}
      {expandedItem && (
        <div ref={expandedPanelRef}>
        <Card variant="canvas" className={`w-full border-teal`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-poster text-vintage-text">
                {expandedItem.title}
              </h3>
              <span className="font-ui uppercase text-xs text-vintage-text opacity-70">
                {expandedItem.category}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpandedItem(null)}>
              Close
            </Button>
          </div>
          <p className="text-sm text-vintage-text whitespace-pre-wrap mb-4">
            {expandedItem.content}
          </p>
          {expandedItem.tags && expandedItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expandedItem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-sand text-vintage-text text-xs font-ui rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
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
            <p className="font-serif text-vintage-text/70 italic mb-4">
              {searchQuery ? 'No records match your query.' : 'The archive is empty.'}
            </p>
            <p className="text-sm text-vintage-text/50">
              {searchQuery ? 'Try a different search term.' : 'File your first record to begin cataloging.'}
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
              onEdit={(updatedItem) => updateItem(updatedItem.id, updatedItem)}
              onExpand={setExpandedItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MapRoom;
