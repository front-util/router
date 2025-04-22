import React from 'react';

interface ProductProps {
  categoryId: string;
  productId: string;
  color?: string;
}

const ProductPage: React.FC<ProductProps> = ({ categoryId, productId, color, }) => {
    return (
        <div className="page product-page">
            <h1>Product Details</h1>
            <div className="product-info">
                <h2>Product ID: {productId}</h2>
                <p>Category: {categoryId}</p>
                {color && <p>Selected color: {color}</p>}
            </div>
        </div>
    );
};

export default ProductPage;