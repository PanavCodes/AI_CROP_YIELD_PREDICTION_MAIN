"""
Enhanced Agricultural Chatbot Service
Specialized for farming and agriculture with rich text formatting
"""

import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import re
from .openrouter_service import OpenRouterService

logger = logging.getLogger(__name__)

class AgricultureChatbot:
    """Specialized chatbot for agricultural advice with enhanced formatting"""
    
    def __init__(self):
        # Initialize OpenRouter service
        self.openrouter_service = OpenRouterService()
    
    async def get_agricultural_advice(
        self, 
        question: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get agricultural advice with proper formatting
        """
        try:
            # Validate question is agriculture-related
            if not self._is_agriculture_related(question):
                return self._non_agricultural_response(question)
            
            # Build comprehensive context
            farmer_context = self._build_context(context)
            
            # Try OpenRouter first (primary service)
            if self.openrouter_service.is_initialized:
                logger.info("🚀 Using OpenRouter for agricultural advice")
                response = await self.openrouter_service.get_agricultural_advice(question, farmer_context)
                if response["success"]:
                    return response
                logger.warning("⚠️ OpenRouter failed, using rule-based system...")
            
            # Fallback to rule-based system
            logger.info("📚 Using rule-based knowledge system")
            return self._get_rule_based_response(question, farmer_context)
            
        except Exception as e:
            logger.error(f"Error generating advice: {str(e)}")
            return self._error_response(question)
    
    def _is_agriculture_related(self, question: str) -> bool:
        """Check if question is related to agriculture"""
        question_lower = question.lower().strip()
        
        # Strong agriculture indicators - if found, likely agricultural
        strong_ag_keywords = [
            # Crops
            'crop', 'harvest', 'yield', 'cultivation', 'farming', 'agriculture',
            'rice', 'wheat', 'maize', 'corn', 'cotton', 'sugarcane', 'pulse',
            'vegetable', 'tomato', 'potato', 'onion', 'mango',
            
            # Farming practices
            'farm', 'field', 'irrigation', 'fertilizer', 'pesticide', 'insecticide', 
            'herbicide', 'organic', 'compost', 'manure', 'mulch', 'tillage', 
            'sowing', 'planting', 'soil',
            
            # Problems
            'pest', 'weed', 'blight', 'deficiency', 'nutrition', 'stunted',
            
            # Seasons
            'kharif', 'rabi', 'zaid',
            
            # Market & economics
            'mandi', 'msp', 'subsidy'
        ]
        
        # Weak indicators - need context to determine if agricultural
        contextual_keywords = [
            'plant', 'seed', 'disease', 'yellow', 'wilting', 'rot', 'growth', 
            'attack', 'water', 'weather', 'rain', 'monsoon', 'drought', 
            'temperature', 'climate', 'season', 'summer', 'winter',
            'price', 'market', 'sell', 'profit', 'cost', 'insurance', 'loan', 
            'scheme', 'government'
        ]
        
        # Non-agricultural exclusions - if these patterns match, likely not agricultural
        non_ag_patterns = [
            # General questions
            'what is the capital',
            'how to code',
            'how to cook',
            'tell me a joke',
            'best movies',
            'how to lose weight',
            'what is cryptocurrency',
            'what is machine learning',
            'how to fix',
            'what\'s the weather like',
            'weather today',
            'current weather',
            
            # Programming/tech
            'python', 'javascript', 'html', 'css', 'programming',
            'software', 'computer', 'algorithm',
            
            # General knowledge
            'history', 'geography', 'mathematics', 'physics', 'chemistry',
            'literature', 'politics', 'economics' 
        ]
        
        # Check for non-agricultural patterns first
        for pattern in non_ag_patterns:
            if pattern in question_lower:
                return False
        
        # Check for strong agriculture indicators
        for keyword in strong_ag_keywords:
            if keyword in question_lower:
                return True
        
        # For contextual keywords, need additional context
        contextual_matches = [kw for kw in contextual_keywords if kw in question_lower]
        if contextual_matches:
            # Check if the question has agricultural context
            ag_context_words = [
                'crop', 'farm', 'field', 'agriculture', 'cultivation',
                'harvest', 'plant', 'grow', 'soil', 'fertilizer'
            ]
            
            # If we have contextual matches AND agricultural context words
            if any(ctx_word in question_lower for ctx_word in ag_context_words):
                return True
            
            # Special cases for common agricultural phrases
            agricultural_phrases = [
                'plant', 'plants have', 'my crop', 'in my field', 'farming',
                'for crops', 'crop disease', 'plant disease', 'soil health',
                'irrigation', 'best time to plant', 'when to harvest',
                'fertilizer for', 'pest control', 'crop yield'
            ]
            
            if any(phrase in question_lower for phrase in agricultural_phrases):
                return True
        
        # If no strong indicators or contextual matches, not agricultural
        return False
    
    def _build_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Build comprehensive farming context"""
        if not context:
            context = {}
        
        current_month = datetime.now().strftime("%B")
        current_season = self._get_current_season()
        
        return {
            "location": context.get("location", "India"),
            "state": context.get("state", "General Region"),
            "crops": context.get("crops", "Mixed crops"),
            "farm_size": context.get("farm_size", "Small-Medium"),
            "experience": context.get("experience", "Moderate"),
            "soil_type": context.get("soil_type", "Not specified"),
            "irrigation": context.get("irrigation", "Available"),
            "current_month": current_month,
            "current_season": current_season,
            "farming_type": context.get("farming_type", "Traditional")
        }
    
    def _get_current_season(self) -> str:
        """Get current agricultural season in India"""
        month = datetime.now().month
        if month in [6, 7, 8, 9, 10]:
            return "Kharif (Monsoon Season)"
        elif month in [10, 11, 12, 1, 2, 3]:
            return "Rabi (Winter Season)"
        else:
            return "Zaid (Summer Season)"
    
    
    def _categorize_question(self, question: str) -> str:
        """Categorize the agricultural question"""
        question_lower = question.lower()
        
        # Check if it's actually a non-agricultural question first
        if not self._is_agriculture_related(question):
            return "non_agricultural"
        
        categories = {
            "crop_selection": ["which crop", "what to plant", "crop selection", "best crop"],
            "pest_management": ["pest", "insect", "attack", "infestation"],
            "disease_control": ["disease", "yellow", "wilting", "rot", "fungus"],
            "fertilizer": ["fertilizer", "nutrient", "npk", "urea", "dap"],
            "irrigation": ["water", "irrigation", "drought", "moisture"],
            "harvest": ["harvest", "when to harvest", "maturity"],
            "market": ["price", "sell", "market", "mandi"],
            "weather": ["weather for crop", "rain for farming", "climate for agriculture"],
            "soil": ["soil", "ph", "testing", "quality"],
            "general": ["how to", "what is", "why", "when"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in question_lower for keyword in keywords):
                return category
        
        return "general_farming"
    
    def _get_rule_based_response(
        self, 
        question: str, 
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fallback rule-based response with formatting"""
        question_lower = question.lower()
        response_text = ""
        
        # Check for specific topics
        if "yellow" in question_lower and ("leaf" in question_lower or "leaves" in question_lower):
            response_text = self._format_yellowing_leaves_response(context)
        elif "pest" in question_lower:
            response_text = self._format_pest_control_response(context)
        elif "fertilizer" in question_lower:
            response_text = self._format_fertilizer_response(context)
        elif "water" in question_lower or "irrigation" in question_lower:
            response_text = self._format_irrigation_response(context)
        elif "harvest" in question_lower:
            response_text = self._format_harvest_response(context)
        elif "disease" in question_lower:
            response_text = self._format_disease_response(context)
        else:
            response_text = self._format_general_response(question, context)
        
        return {
            "success": True,
            "response": response_text,
            "ai_service": "Agricultural Knowledge Base",
            "confidence": "medium",
            "formatted": True,
            "question_category": self._categorize_question(question),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _format_yellowing_leaves_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for yellowing leaves issue"""
        return f"""## 🌱 **Yellowing Leaves - Diagnosis & Treatment**

### 🔍 **Quick Diagnosis**

Yellowing leaves (*chlorosis*) in your crops can indicate several issues. Let's identify and fix the problem!

### 📋 **Common Causes & Solutions**

#### 1. **Nutrient Deficiencies** (Most Common)

| Nutrient | Symptoms | Solution |
|----------|----------|----------|
| **Nitrogen** | Lower leaves yellow first | Apply Urea @ 50kg/acre |
| **Iron** | Young leaves yellow, veins green | Spray FeSO₄ @ 0.5% |
| **Magnesium** | Interveinal yellowing | Apply MgSO₄ @ 25kg/acre |
| **Sulfur** | Overall pale yellow | Apply gypsum @ 200kg/acre |

#### 2. **Water Issues**

• **Overwatering** 🌊
  - Symptoms: Yellow + wilting
  - Solution: Improve drainage immediately
  
• **Underwatering** 🏜️
  - Symptoms: Yellow + crispy edges
  - Solution: Regular irrigation schedule

### 🛠️ **Immediate Action Plan**

1. **Test your soil pH** (should be 6.0-7.0 for most crops)
2. **Check soil moisture** at 6-inch depth
3. **Apply foliar spray** of micronutrients (2ml/L)
4. **Add organic matter** (compost/FYM @ 5 tons/acre)
5. **Ensure proper drainage** in field

### ⏰ **Treatment Schedule**

**Week 1:** Foliar spray + drainage check
**Week 2:** Soil amendment application
**Week 3:** Monitor improvement
**Week 4:** Second application if needed

### 💰 **Cost-Effective Solutions**

• Neem cake: ₹1,200/quintal (organic option)
• Vermicompost: ₹800/quintal
• Foliar spray: ₹200/acre

### ⚠️ **Common Mistakes to Avoid**

❌ Over-fertilizing (can burn roots)
❌ Ignoring drainage issues
❌ Using contaminated water
❌ Applying fertilizer to dry soil

### 📞 **Need More Help?**

Contact your local **Krishi Vigyan Kendra** or call **Kisan Helpline: 1800-180-1551**

> 💡 **Pro Tip:** Prevention is better than cure! Regular soil testing every season helps avoid such issues."""
    
    def _format_pest_control_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for pest control"""
        return f"""## 🐛 **Integrated Pest Management (IPM) Guide**

### 🎯 **Current Season:** {context['current_season']}

### 🔍 **Pest Identification First!**

Before treatment, correctly identify your pest:

1. **Check timing** - Morning or evening activity?
2. **Inspect damage** - Holes, wilting, or discoloration?
3. **Look for pests** - Under leaves, in soil, on stems
4. **Take photos** - For expert identification

### 🛡️ **IPM Strategy - The 4-Step Approach**

#### Step 1: **Prevention** (Most Important!)
• Crop rotation every season
• Remove crop residues
• Use resistant varieties
• Maintain field hygiene

#### Step 2: **Monitoring**
• Scout fields twice weekly
• Use pheromone traps (₹150/trap)
• Check for natural enemies
• Note pest population levels

#### Step 3: **Biological Control** 🌿
• **Trichogramma cards** - For borers (₹50/card)
• **NPV (Nuclear Polyhedrosis Virus)** - For caterpillars
• **Beauveria bassiana** - For sucking pests
• **Neem oil** - 5ml/liter water

#### Step 4: **Chemical Control** (Last Resort)

| Pest Type | Recommended Chemical | Dosage | Safety Period |
|-----------|---------------------|---------|---------------|
| Aphids | Imidacloprid | 0.5ml/L | 15 days |
| Caterpillars | Chlorantraniliprole | 0.3ml/L | 7 days |
| Whitefly | Thiamethoxam | 0.4g/L | 21 days |
| Thrips | Fipronil | 1.5ml/L | 14 days |

### 📅 **Spray Schedule**

**Morning (6-9 AM)** or **Evening (4-7 PM)** only
Never spray during:
• Flowering stage 🌸
• Windy conditions 💨
• Before rain ☔

### 💰 **Cost Analysis**

**Organic Methods:** ₹500-800/acre
**Chemical Methods:** ₹1,200-1,500/acre
**IPM Approach:** ₹700-900/acre (Best value!)

### ⚠️ **Safety Precautions**

Always use:
✅ Protective clothing
✅ Mask and gloves
✅ Clean water for mixing
✅ Proper disposal methods

### 🌟 **Success Tips**

> "The best pesticide is the farmer's footsteps in the field" - Regular monitoring prevents major outbreaks!

### 📱 **Digital Tools**

Download **Plantix** app for instant pest identification
Use **IFFCO Kisan** app for expert advice"""
    
    def _format_fertilizer_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for fertilizer management"""
        return f"""## 🌿 **Fertilizer Management Guide**

### 📍 **Your Context**
• Location: {context['location']}
• Season: {context['current_season']}
• Soil Type: {context['soil_type']}

### 🎯 **Golden Rule of Fertilization**

> **"Feed the soil, not just the plant"** - Balanced nutrition is key!

### 📊 **NPK Requirements by Crop**

| Crop | N (kg/ha) | P (kg/ha) | K (kg/ha) | Best Time |
|------|-----------|-----------|-----------|-----------|
| Rice | 120 | 60 | 40 | 3 splits |
| Wheat | 120 | 60 | 40 | 2-3 splits |
| Maize | 120 | 60 | 40 | 3 splits |
| Cotton | 150 | 60 | 60 | 3-4 splits |
| Pulses | 20 | 40 | 20 | Basal only |

### 🗓️ **Application Schedule**

#### **Basal Dose** (At sowing)
• 50% Nitrogen
• 100% Phosphorus
• 100% Potassium

#### **First Top Dressing** (25-30 days)
• 25% Nitrogen

#### **Second Top Dressing** (45-50 days)
• 25% Nitrogen

### 💡 **Smart Fertilizer Combinations**

**Option 1: Traditional**
• DAP: 100 kg/acre
• Urea: 130 kg/acre
• MOP: 50 kg/acre

**Option 2: Modern**
• NPK (12:32:16): 150 kg/acre
• Urea: 100 kg/acre

**Option 3: Organic + Chemical**
• FYM: 5 tons/acre
• Urea: 65 kg/acre
• SSP: 100 kg/acre

### 🌱 **Micronutrients** (Don't Forget!)

• **Zinc Sulfate:** 25 kg/ha (for rice, wheat)
• **Boron:** 10 kg/ha (for pulses, oilseeds)
• **Iron:** Foliar spray 0.5% FeSO₄

### 💰 **Cost Optimization Tips**

1. **Soil test first** - Save 25% on fertilizer costs
2. **Use nano fertilizers** - 50% less quantity needed
3. **Apply vermicompost** - Reduces chemical fertilizer by 30%
4. **Government subsidy** - Check PM-KISAN scheme

### ⚠️ **Common Mistakes to Avoid**

❌ Broadcasting urea in standing water
❌ Applying to dry soil
❌ Mixing incompatible fertilizers
❌ Overdosing (causes lodging)

### 📈 **Expected Yield Increase**

With proper fertilization:
• **15-25%** yield increase
• **Better quality** produce
• **Higher market price**

### 🔬 **Soil Testing Centers**

Visit nearest:
• Soil Testing Laboratory
• Krishi Vigyan Kendra
• Agricultural University

Cost: ₹50-200 per sample"""
    
    def _format_irrigation_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for irrigation management"""
        return f"""## 💧 **Smart Irrigation Management**

### 🌍 **Your Region:** {context['location']}
### 🌤️ **Current Season:** {context['current_season']}

### 💦 **Irrigation Methods Comparison**

| Method | Water Saved | Cost | Best For |
|--------|------------|------|----------|
| **Drip** | 40-60% | High | Vegetables, Fruits |
| **Sprinkler** | 30-40% | Medium | Field crops |
| **Furrow** | 20-30% | Low | Row crops |
| **Flood** | Baseline | Lowest | Rice, Flat fields |

### ⏰ **Optimal Irrigation Timing**

**Best Time:** 🌅 Early morning (4-8 AM)
**Avoid:** ☀️ Noon (high evaporation)

### 📊 **Crop Water Requirements**

#### **Critical Stages for Irrigation**

**🌾 Rice:**
• Transplanting
• Tillering
• Flowering
• Grain filling

**🌾 Wheat:**
• Crown root initiation (21 DAS)
• Tillering (45 DAS)
• Flowering (75 DAS)
• Grain filling (95 DAS)

### 🔍 **When to Irrigate? - Simple Tests**

1. **Feel Method:** Soil at 6" depth should form ball
2. **Tensiometer Reading:** 20-40 centibars
3. **Leaf Rolling:** First sign in afternoon
4. **Soil Moisture:** Below 50% field capacity

### 💰 **Government Schemes**

• **PM KUSUM:** Solar pump subsidy (60%)
• **PMKSY:** Micro irrigation subsidy (55%)
• **State schemes:** Check local agriculture office

### 📈 **Water Conservation Techniques**

✅ **Mulching** - Saves 25% water
✅ **Raised beds** - Saves 30% water
✅ **Laser leveling** - Saves 20% water
✅ **Rainwater harvesting** - Free water source!

### 🌟 **Pro Tips**

> 💡 "One deep irrigation is better than frequent shallow irrigation"

• Install rain gauge (₹200)
• Use soil moisture meter (₹500)
• Maintain irrigation channels
• Check for leaks regularly

### ⚠️ **Avoid These Mistakes**

❌ Over-irrigation (causes root rot)
❌ Irrigation before rain
❌ Using saline water
❌ Ignoring drainage

### 📱 **Useful Apps**

• **Meghdoot** - Weather-based irrigation advice
• **Crop Water** - Calculate water requirements"""
    
    def _format_harvest_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for harvesting guidance"""
        return f"""## 🌾 **Harvesting Guide**

### 📅 **Current Season:** {context['current_season']}

### 🎯 **Maturity Indicators**

#### **Visual Signs:**
• Grain color change
• Leaf yellowing (85-90%)
• Stem drying
• Head bending

#### **Technical Indicators:**
• Moisture content: 18-22%
• Grain hardness test
• Black layer formation (maize)

### ⏰ **Optimal Harvest Time**

**Best Period:** Early morning or late evening
**Avoid:** Noon (grain shattering risk)

### 📊 **Crop-Specific Harvest Guide**

| Crop | Days to Maturity | Moisture % | Key Sign |
|------|-----------------|------------|----------|
| Rice | 120-140 | 20-22% | Golden yellow |
| Wheat | 110-120 | 18-20% | Hard grain |
| Maize | 90-110 | 20-25% | Black layer |
| Pulses | 80-90 | 15-18% | Pod color |

### 🔧 **Harvesting Methods**

**Manual:** Best for small farms
**Machine:** Cost-effective for >2 acres
**Combined Harvester:** ₹1,500-2,000/hour

### 💰 **Post-Harvest Management**

1. **Immediate Drying** - Reduce to 12-14% moisture
2. **Cleaning** - Remove foreign material
3. **Grading** - Better price for quality
4. **Storage** - Proper bags and godowns

### 📈 **Value Addition Tips**

• Grade your produce (15-20% better price)
• Clean and pack properly
• Direct marketing to avoid middlemen
• Store for better prices (if possible)

### ⚠️ **Common Harvesting Losses**

• Delayed harvest: 5-10% loss
• Poor technique: 3-5% loss
• Weather damage: 10-15% loss
• Bird/rodent damage: 2-3% loss

**Total preventable loss: Up to 20%!**

### 🌟 **Best Practices**

✅ Test moisture before harvest
✅ Sharp sickles/machinery
✅ Avoid harvesting wet crop
✅ Quick transportation to storage

### 📞 **Market Information**

Check prices at:
• eNAM portal
• Local mandi
• APMC website"""
    
    def _format_disease_response(self, context: Dict[str, Any]) -> str:
        """Formatted response for disease management"""
        return f"""## 🦠 **Crop Disease Management**

### 🔍 **Disease Identification Guide**

#### **Check These Symptoms:**

| Symptom | Possible Disease | Affected Part |
|---------|-----------------|---------------|
| Yellow spots | Leaf spot | Leaves |
| White powder | Powdery mildew | Leaves, stem |
| Brown patches | Blight | Leaves, fruits |
| Wilting | Wilt/Root rot | Whole plant |
| Stunted growth | Viral disease | Whole plant |

### 🛡️ **Disease Management Strategy**

#### **1. Prevention (Best Approach)**
• Use certified disease-free seeds
• Crop rotation (break disease cycle)
• Maintain field sanitation
• Proper spacing for air circulation

#### **2. Cultural Control**
• Remove infected plants immediately
• Burn crop residues
• Avoid overhead irrigation
• Maintain optimal plant nutrition

#### **3. Biological Control** 🌿
• **Trichoderma**: Soil application @ 5kg/acre
• **Pseudomonas**: Seed treatment @ 10g/kg
• **Neem cake**: 200kg/acre in soil

#### **4. Chemical Control**

**Fungicides Schedule:**

| Disease Type | Chemical | Dosage | Interval |
|-------------|----------|---------|----------|
| Fungal | Mancozeb | 2g/L | 10-15 days |
| Bacterial | Streptocycline | 0.1g/L | 7-10 days |
| Viral | No direct control | - | Prevention only |

### 📅 **Spray Calendar**

**Preventive Spray:** Before disease appearance
**Curative Spray:** At first symptom
**Follow-up:** Every 10-15 days (2-3 sprays)

### ⚠️ **Safety Guidelines**

Always:
✅ Wear protective gear
✅ Spray in calm weather
✅ Follow pre-harvest interval
✅ Dispose containers safely

### 💰 **Cost-Benefit Analysis**

• Prevention cost: ₹300-500/acre
• Treatment cost: ₹800-1,200/acre
• Potential loss if untreated: 20-50% yield

**ROI on disease management: 1:5**

### 📱 **Disease Identification Apps**

• **Plantix** - Photo-based diagnosis
• **Crop Doctor** - Expert system
• **IFFCO Kisan** - Video consultation

### 🌟 **Remember**

> "A healthy crop is a profitable crop - invest in prevention!"

### 📞 **Expert Help**

• Plant Protection Officer
• Agricultural Extension Office
• University Plant Clinic"""
    
    def _format_general_response(self, question: str, context: Dict[str, Any]) -> str:
        """Formatted general agricultural response"""
        return f"""## 🌾 **Agricultural Guidance**

### 📍 **Your Farming Context**
• **Location:** {context['location']}
• **Season:** {context['current_season']}
• **Primary Crops:** {context['crops']}

### 💡 **Response to Your Query**

Based on your question about *"{question[:100]}..."*, here's comprehensive agricultural guidance:

### 🌱 **Key Considerations**

#### **1. Seasonal Factors**
In {context['current_season']}, focus on:
• Appropriate crop selection
• Weather-based planning
• Market demand patterns

#### **2. Local Conditions**
• Soil type suitability
• Water availability
• Climate adaptability
• Pest prevalence

#### **3. Economic Aspects**
• Input costs
• Expected yields
• Market prices
• Government support

### 📋 **General Best Practices**

✅ **Soil Health**
• Test soil every season
• Add organic matter regularly
• Maintain pH 6.0-7.5
• Practice crop rotation

✅ **Water Management**
• Efficient irrigation methods
• Rainwater harvesting
• Moisture conservation
• Drainage management

✅ **Crop Protection**
• Integrated Pest Management
• Regular field monitoring
• Timely interventions
• Safe chemical usage

✅ **Market Intelligence**
• Track price trends
• Quality grading
• Value addition
• Direct marketing

### 🔬 **Modern Techniques**

| Technology | Benefit | Investment |
|------------|---------|------------|
| Soil testing | 25% fertilizer saving | ₹200/test |
| Drip irrigation | 40% water saving | ₹40,000/acre |
| Mulching | Moisture retention | ₹2,000/acre |
| Vermicompost | Soil improvement | ₹5,000 setup |

### 📱 **Useful Resources**

**Mobile Apps:**
• Kisan Suvidha
• mKisan
• AgriApp
• Shetkari

**Websites:**
• farmer.gov.in
• agricoop.nic.in
• agmarknet.gov.in

### 📞 **Support Services**

• **Kisan Call Center:** 1800-180-1551
• **Krishi Vigyan Kendra:** Local KVK
• **Agricultural Officer:** Block/District level
• **ATMA:** Extension services

### 💰 **Government Schemes**

• **PM-KISAN:** ₹6,000/year direct benefit
• **Crop Insurance:** PMFBY scheme
• **Soil Health Card:** Free soil testing
• **Subsidies:** Seeds, fertilizers, equipment

### 🌟 **Success Mantra**

> "Successful farming = Right crop + Right time + Right method + Market awareness"

### ❓ **Need More Specific Help?**

Please ask about:
• Specific crop problems
• Detailed cultivation practices
• Market information
• Government schemes
• Technology adoption

I'm here to help with all your agricultural queries!"""
    
    def _non_agricultural_response(self, question: str) -> Dict[str, Any]:
        """Response for non-agricultural questions"""
        return {
            "success": True,
            "response": f"""## 🌾 **Agricultural Assistant**

I notice your question *"{question[:100]}..."* doesn't appear to be related to agriculture or farming.

### 🎯 **I'm Specialized In:**

• **Crop Management** - Selection, planting, maintenance
• **Pest & Disease Control** - Identification and treatment
• **Soil & Fertilizer** - Nutrition management
• **Irrigation** - Water management techniques
• **Harvest & Storage** - Best practices
• **Market Information** - Prices and trends
• **Government Schemes** - Agricultural subsidies
• **Weather Advisory** - Climate-smart farming

### 💡 **Try Asking About:**

1. "Which crop should I plant this season?"
2. "How to control pests in my field?"
3. "What fertilizer to use for wheat?"
4. "When to harvest my rice crop?"
5. "How to improve soil health?"
6. "Current market prices for crops"

### 📞 **For Other Queries:**

If you need help with non-agricultural topics, please consult appropriate resources or experts in those fields.

**I'm here to help with all your farming and agriculture needs!** 🌱""",
            "ai_service": "Agricultural Assistant",
            "confidence": "high",
            "formatted": True,
            "question_category": "non_agricultural",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _error_response(self, question: str) -> Dict[str, Any]:
        """Error response with helpful information"""
        return {
            "success": False,
            "response": f"""## ⚠️ **Temporary Service Issue**

I encountered an issue processing your question. However, here's some general guidance:

### 📞 **Immediate Help Available:**

• **Kisan Call Center:** 1800-180-1551 (Toll-free)
• **Local Agriculture Officer:** Contact your block/district office
• **Krishi Vigyan Kendra:** Nearest KVK for expert advice

### 💡 **Meanwhile, You Can:**

1. Check the **Kisan Suvidha** app
2. Visit **farmer.gov.in** portal
3. Contact local successful farmers
4. Visit nearest agricultural university

### 🔄 **Please Try Again**

The service will be restored shortly. Your question about *"{question[:50]}..."* is important, and I'll be able to help once the connection is restored.

**Thank you for your patience!** 🌾""",
            "ai_service": "Agricultural Assistant (Offline Mode)",
            "confidence": "low",
            "formatted": True,
            "error": "Service temporarily unavailable",
            "timestamp": datetime.utcnow().isoformat()
        }

# Export the class
__all__ = ['AgricultureChatbot']