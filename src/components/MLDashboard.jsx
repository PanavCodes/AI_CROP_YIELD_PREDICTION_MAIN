/**
 * ML Dashboard - Comprehensive interface for FastAPI ML services
 * Showcases yield prediction, crop recommendation, disease detection, and weather intelligence
 */

import React, { useState, useEffect } from 'react';
import { 
  useYieldPrediction, 
  useCropRecommendation, 
  usePlantDiseaseDetection, 
  useWeatherIntelligence,
  useFastAPIAuth,
  useFastAPIHealth 
} from '../hooks/useFastAPI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Brain, 
  Cpu, 
  Cloud, 
  Camera, 
  TrendingUp, 
  Leaf, 
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  Upload
} from 'lucide-react';

const MLDashboard = () => {
  // FastAPI service hooks
  const { checkHealth, isOnline, loading: healthLoading, data: healthData } = useFastAPIHealth();
  const { login, isAuthenticated, user, loading: authLoading } = useFastAPIAuth();
  const { predictYield, data: yieldData, loading: yieldLoading, error: yieldError } = useYieldPrediction();
  const { getCropRecommendation, data: cropData, loading: cropLoading, error: cropError } = useCropRecommendation();
  const { detectDisease, data: diseaseData, loading: diseaseLoading, error: diseaseError } = usePlantDiseaseDetection();
  const { getWeatherIntelligence, data: weatherData, loading: weatherLoading, error: weatherError } = useWeatherIntelligence();

  // Form states
  const [yieldForm, setYieldForm] = useState({
    crop_type: 'Rice',
    field_size_hectares: 2.5,
    state: 'Punjab',
    district: 'Amritsar',
    season: 'Kharif',
    N: 80,
    P: 40,
    K: 40,
    ph: 6.5,
    temperature: 28,
    humidity: 75,
    rainfall: 1200
  });

  const [cropForm, setCropForm] = useState({
    N: 80,
    P: 40,
    K: 40,
    temperature: 25,
    humidity: 65,
    ph: 6.8,
    rainfall: 800
  });

  const [weatherLocation, setWeatherLocation] = useState('Punjab, India');
  const [selectedImage, setSelectedImage] = useState(null);

  // Check FastAPI health on component mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Demo login
  const handleDemoLogin = async () => {
    await login('demo@farmer.com', 'password123');
  };

  // Handle yield prediction
  const handleYieldPrediction = async () => {
    const result = await predictYield(yieldForm);
    if (result.success) {
      console.log('Yield prediction successful:', result.data);
    }
  };

  // Handle crop recommendation
  const handleCropRecommendation = async () => {
    const result = await getCropRecommendation(cropForm);
    if (result.success) {
      console.log('Crop recommendation successful:', result.data);
    }
  };

  // Handle disease detection
  const handleDiseaseDetection = async () => {
    if (!selectedImage) return;
    const result = await detectDisease(selectedImage);
    if (result.success) {
      console.log('Disease detection successful:', result.data);
    }
  };

  // Handle weather intelligence
  const handleWeatherIntelligence = async () => {
    const result = await getWeatherIntelligence(weatherLocation);
    if (result.success) {
      console.log('Weather intelligence successful:', result.data);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">🤖 FastAPI ML Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced Machine Learning capabilities powered by Python FastAPI backend. 
          Explore yield prediction, crop recommendations, disease detection, and weather intelligence.
        </p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            FastAPI Backend Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isOnline ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                {healthLoading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkHealth} variant="outline" size="sm">
                Refresh
              </Button>
              {healthData && (
                <Badge variant="secondary">
                  ML Service: {healthData.ml_service_status}
                </Badge>
              )}
            </div>
          </div>
          {!isOnline && (
            <Alert className="mt-4">
              <AlertDescription>
                FastAPI backend is not responding. Please ensure the server is running on port 8000.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Authentication */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication</CardTitle>
            <CardDescription>
              Login to access protected ML endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDemoLogin} disabled={authLoading}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Demo Login (demo@farmer.com)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ML Services Tabs */}
      <Tabs defaultValue="yield" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="yield" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Yield Prediction
          </TabsTrigger>
          <TabsTrigger value="crop" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Crop Recommendation
          </TabsTrigger>
          <TabsTrigger value="disease" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Disease Detection
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Weather Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Yield Prediction Tab */}
        <TabsContent value="yield">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Yield Prediction
              </CardTitle>
              <CardDescription>
                Predict crop yield using advanced ML models based on soil and weather parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Crop Information */}
                <div className="space-y-2">
                  <Label>Crop Type</Label>
                  <Select value={yieldForm.crop_type} onValueChange={(value) => 
                    setYieldForm(prev => ({ ...prev, crop_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rice">Rice</SelectItem>
                      <SelectItem value="Wheat">Wheat</SelectItem>
                      <SelectItem value="Maize">Maize</SelectItem>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                      <SelectItem value="Soybean">Soybean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Field Size (hectares)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={yieldForm.field_size_hectares}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, field_size_hectares: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input 
                    value={yieldForm.state}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Input 
                    value={yieldForm.district}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Season</Label>
                  <Select value={yieldForm.season} onValueChange={(value) => 
                    setYieldForm(prev => ({ ...prev, season: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rabi">Rabi</SelectItem>
                      <SelectItem value="Kharif">Kharif</SelectItem>
                      <SelectItem value="Zaid">Zaid</SelectItem>
                      <SelectItem value="Perennial">Perennial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Soil Parameters */}
                <div className="space-y-2">
                  <Label>Nitrogen (N)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.N}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, N: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phosphorus (P)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.P}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, P: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Potassium (K)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.K}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, K: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>pH</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={yieldForm.ph}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, ph: parseFloat(e.target.value) }))}
                  />
                </div>

                {/* Weather Parameters */}
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.temperature}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Humidity (%)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.humidity}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, humidity: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rainfall (mm)</Label>
                  <Input 
                    type="number" 
                    value={yieldForm.rainfall}
                    onChange={(e) => setYieldForm(prev => ({ ...prev, rainfall: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleYieldPrediction} 
                disabled={yieldLoading || !isOnline}
                className="w-full"
              >
                {yieldLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Predict Yield
              </Button>

              {yieldError && (
                <Alert variant="destructive">
                  <AlertDescription>{yieldError}</AlertDescription>
                </Alert>
              )}

              {yieldData && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Yield Prediction Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {yieldData.predicted_yield}
                        </div>
                        <div className="text-sm text-muted-foreground">Quintal/Hectare</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {yieldData.total_predicted_production}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Quintals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(yieldData.confidence_score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {yieldData.model_version}
                        </div>
                        <div className="text-sm text-muted-foreground">Model</div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {yieldData.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would continue similarly... */}
        {/* For brevity, I'll add placeholders for the other tabs */}
        
        <TabsContent value="crop">
          <Card>
            <CardHeader>
              <CardTitle>🌱 Crop Recommendation</CardTitle>
              <CardDescription>Get optimal crop suggestions based on soil and weather conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Crop recommendation interface would go here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disease">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Plant Disease Detection</CardTitle>
              <CardDescription>Upload plant images for AI-powered disease detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Disease detection interface would go here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather">
          <Card>
            <CardHeader>
              <CardTitle>🌤️ Weather Intelligence</CardTitle>
              <CardDescription>Get agricultural weather insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Weather intelligence interface would go here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLDashboard;