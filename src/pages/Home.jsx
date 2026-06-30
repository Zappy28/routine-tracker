import Card from "../components/Card";

import { today } from "../data/mockData";


function Home(){


return (

<div>


<h1>
Good Morning
</h1>


<p>
{today.date}
</p>



<Card title="Today's Progress">


<p>
Medicine:
{today.medicine ? " ✅" : " ❌"}
</p>


<p>
Water:
{today.water ? " ✅" : " ❌"}
</p>


<p>
Gym:
{today.gym ? " ✅" : " ❌"}
</p>


</Card>



<Card title="Quick Actions">


<button>
💊 Take Medicine
</button>


<button>
💧 Log Water
</button>


<button>
⚖ Log Weight
</button>


<button>
😊 Log Mood
</button>


</Card>




<Card title="Stats">


<p>
Weight:
{today.weight} lbs
</p>


<p>
Mood:
{today.mood}/10
</p>


</Card>



</div>

)


}


export default Home;