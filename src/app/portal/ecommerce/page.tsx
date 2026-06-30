'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Input, Card, Row, Col, Tag, Badge, Drawer, List, Avatar, Select, Rate } from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  FilterOutlined,
  HeartOutlined,
  StarOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

const categories = [
  { id: 'all', name: '全部商品' },
  { id: 'books', name: '图书典籍' },
  { id: 'clothing', name: '汉服服饰' },
  { id: 'tea', name: '茶具茶品' },
  { id: 'crafts', name: '手工艺品' },
  { id: 'jewelry', name: '饰品配饰' },
];

const products = [
  {
    id: '1',
    name: '四书五经精装珍藏版',
    category: 'books',
    price: 299,
    originalPrice: 399,
    rating: 4.9,
    sales: 1258,
    image: '📚',
    tags: ['热销', '经典'],
  },
  {
    id: '2',
    name: '古风汉服 - 锦绣未央',
    category: 'clothing',
    price: 599,
    originalPrice: 799,
    rating: 4.8,
    sales: 892,
    image: '👗',
    tags: ['新品', '限量'],
  },
  {
    id: '3',
    name: '景德镇青花瓷茶具套装',
    category: 'tea',
    price: 388,
    originalPrice: null,
    rating: 4.7,
    sales: 567,
    image: '🍵',
    tags: ['推荐'],
  },
  {
    id: '4',
    name: '手工刺绣屏风摆件',
    category: 'crafts',
    price: 888,
    originalPrice: 1288,
    rating: 4.9,
    sales: 324,
    image: '🖼️',
    tags: ['精品'],
  },
  {
    id: '5',
    name: '和田玉平安扣吊坠',
    category: 'jewelry',
    price: 1280,
    originalPrice: 1680,
    rating: 4.9,
    sales: 234,
    image: '💎',
    tags: ['珍品'],
  },
  {
    id: '6',
    name: '《论语》解读译注本',
    category: 'books',
    price: 68,
    originalPrice: 88,
    rating: 4.6,
    sales: 2345,
    image: '📖',
    tags: ['热销'],
  },
  {
    id: '7',
    name: '古筝造型书签套装',
    category: 'crafts',
    price: 58,
    originalPrice: null,
    rating: 4.5,
    sales: 1567,
    image: '🎐',
    tags: ['文创'],
  },
  {
    id: '8',
    name: '古风发簪步摇',
    category: 'jewelry',
    price: 168,
    originalPrice: 218,
    rating: 4.7,
    sales: 789,
    image: '🌸',
    tags: ['精美'],
  },
];

const cartItems = [
  { id: '1', name: '四书五经精装珍藏版', price: 299, quantity: 2, image: '📚' },
  { id: '2', name: '古风汉服 - 锦绣未央', price: 599, quantity: 1, image: '👗' },
];

export default function EcommercePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartList, setCartList] = useState(cartItems);
  const [sortBy, setSortBy] = useState('default');

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'sales':
        return b.sales - a.sales;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cartList.find((item) => item.id === product.id);
    if (existingItem) {
      setCartList(cartList.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartList([...cartList, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartList(cartList.map((item) => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCartList(cartList.filter((item) => item.id !== id));
  };

  const cartTotal = cartList.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            国学商城
          </div>

          <div className="flex items-center gap-4 flex-1 justify-center">
            <Input
              placeholder="搜索商品..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 400 }}
            />
          </div>

          <Badge count={cartList.reduce((sum, item) => sum + item.quantity, 0)}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => setCartOpen(true)}
            >
              购物车
            </Button>
          </Badge>
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Menu mode="horizontal" className="flex-wrap gap-2">
            {categories.map((cat) => (
              <Menu.Item
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id ? 'bg-blue-100 text-blue-600' : ''}
              >
                {cat.name}
              </Menu.Item>
            ))}
          </Menu>

          <div className="flex items-center gap-4">
            <Button type="text" icon={<FilterOutlined />}>筛选</Button>
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'default', label: '默认排序' },
                { value: 'price-asc', label: '价格从低到高' },
                { value: 'price-desc', label: '价格从高到低' },
                { value: 'sales', label: '销量优先' },
                { value: 'rating', label: '评分优先' },
              ]}
            />
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {sortedProducts.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <Card
                hoverable
                cover={
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl relative">
                    {product.image}
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
                    />
                  </div>
                }
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <Tag key={tag} color={tag === '热销' ? 'red' : tag === '新品' ? 'green' : 'blue'}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Rate disabled defaultValue={product.rating} allowHalf className="text-sm" />
                        <span className="text-sm text-gray-500">{product.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-red-500">¥{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through ml-2">¥{product.originalPrice}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{product.sales}人已购</span>
                      </div>
                    </div>
                  }
                />
                <Button type="primary" className="w-full mt-3" onClick={() => addToCart(product)}>
                  加入购物车
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      <Drawer
        title="购物车"
        placement="right"
        onClose={() => setCartOpen(false)}
        open={cartOpen}
        width={400}
      >
        {cartList.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartOutlined className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">购物车是空的</p>
          </div>
        ) : (
          <div className="space-y-4">
            <List
              dataSource={cartList}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="dec" type="text" onClick={() => updateCartQuantity(item.id, -1)}>
                      <MinusOutlined />
                    </Button>,
                    <span key="qty" className="w-8 text-center">{item.quantity}</span>,
                    <Button key="inc" type="text" onClick={() => updateCartQuantity(item.id, 1)}>
                      <PlusOutlined />
                    </Button>,
                    <Button key="del" type="text" danger onClick={() => removeFromCart(item.id)}>
                      <DeleteOutlined />
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{item.image}</Avatar>}
                    title={item.name}
                    description={`¥${item.price}`}
                  />
                </List.Item>
              )}
            />

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span>商品数量</span>
                <span>{cartList.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">合计</span>
                <span className="text-xl font-bold text-red-500">¥{cartTotal.toFixed(2)}</span>
              </div>
              <Button type="primary" size="large" className="w-full">
                去结算
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </Layout>
  );
}
