-- Create medicines table
CREATE TABLE medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  category TEXT,
  purchase_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  medicine_id UUID REFERENCES medicines(id) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policies for medicines
CREATE POLICY "Users can view their own medicines"
  ON medicines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines"
  ON medicines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines"
  ON medicines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines"
  ON medicines FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for sales
CREATE POLICY "Users can view their own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update stock on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE medicines
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.medicine_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the stock update
CREATE TRIGGER update_stock_after_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale();
